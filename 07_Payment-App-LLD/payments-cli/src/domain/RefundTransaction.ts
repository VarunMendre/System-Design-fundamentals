import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/UserRepository";
import { TransactionType } from "./enums";
import { Transaction } from "./Transaction";

export class RefundTransaction extends Transaction {
  constructor(public readonly originalTransaction: Transaction) {
    super(TransactionType.REFUND, originalTransaction.amount);
  }

  // Both the original sender and receiver see the refund in their history.
  involves(userId: number): boolean {
    return this.originalTransaction.involves(userId);
  }

  settle(users: UserRepository): void {
    this.originalTransaction.reverse(users);
  }

  reverse(): void {
    throw new AppError("A refund cannot be reversed");
  }
}
