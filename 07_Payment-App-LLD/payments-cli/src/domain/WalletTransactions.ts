import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/UserRepository";
import { TransactionType } from "./enums";
import { Transaction } from "./Transaction";

export class WalletTransaction extends Transaction {
  constructor(
    public readonly fromUserId: number,
    public readonly toUserId: number,
    amount: number,
  ) {
    super(TransactionType.WALLET_TO_WALLET, amount);
  }

  involves(userId: number): boolean {
    return userId === this.fromUserId || userId === this.toUserId;
  }

  settle(users: UserRepository): void {
    const from = users.findById(this.fromUserId);
    const to = users.findById(this.toUserId);

    if (!from || !to) throw new AppError("Sender or Receiver not found");

    if (!from.hasFunds(this.amount)) throw new AppError("Insufficient balance");

    from.debit(this.amount);
    to.credit(this.amount);

    users.save(from);
    users.save(to);
  }

  reverse(users: UserRepository): void {
    const from = users.findById(this.fromUserId);
    const to = users.findById(this.toUserId);

    if (!from || !to) throw new AppError("Sender or Receiver not found");

    if (!to.hasFunds(this.amount))
      throw new AppError("Receiver has insufficient balance");

    to.debit(this.amount);
    from.credit(this.amount);

    users.save(to);
    users.save(from);
  }
}
