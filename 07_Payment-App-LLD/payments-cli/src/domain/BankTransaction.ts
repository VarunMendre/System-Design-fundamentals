import { AppError } from "../errors/AppError";
import { UserRepository } from "../repositories/UserRepository";
import { BankAccount } from "./BankAccount";
import { TransactionType } from "./enums";
import { Transaction } from "./Transaction";

export class BankTransaction extends Transaction {
  constructor(
    public readonly fromUserId: number,
    public readonly bankAccount: BankAccount,
    amount: number,
  ) {
    super(TransactionType.WALLET_TO_BANK, amount);
  }

  involves(userId: number): boolean {
    return userId === this.fromUserId;
  }

  settle(users: UserRepository): void {
    const from = users.findById(this.fromUserId);

    if (!from) throw new AppError("Sender not found");

    if (!from.hasFunds(this.amount)) throw new AppError("Insufficient balance");

    from.debit(this.amount);
    users.save(from);
  }

  reverse(users: UserRepository): void {
    const from = users.findById(this.fromUserId);
    if (!from) throw new AppError("Sender not found");

    from.credit(this.amount);
    users.save(from);
  }
}
