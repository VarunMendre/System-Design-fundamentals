import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/UserRepository";
import { TransactionStatus, TransactionType } from "./enums";

export abstract class Transaction {
  id = 0;
  status = TransactionStatus.PENDING;
  readonly createdAt = new Date();

  constructor(
    public readonly type: TransactionType,
    public readonly amount: number,
  ) {}

  abstract involves(userId: number): boolean;
  abstract settle(users: UserRepository): void;
  abstract reverse(users: UserRepository): void;

  confirm(): void {
    this.assertPending();
    this.status = TransactionStatus.CONFIRMED;
  }

  cancel(): void {
    this.assertPending();
    this.status = TransactionStatus.CANCELLED;
  }

  isRefundable(): boolean {
    return (
      this.status === TransactionStatus.CONFIRMED &&
      this.type !== TransactionType.REFUND
    );
  }

    private assertPending(): void {
        if (this.status !== TransactionStatus.PENDING) {
            throw new AppError(`Transaction ${this.id} is already ${this.status}`);
      }
  }
}
