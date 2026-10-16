import { BankAccount } from "../domain/BankAccount";
import { BankTransaction } from "../domain/BankTransaction";
import { RefundTransaction } from "../domain/RefundTransaction";
import { Transaction } from "../domain/Transaction";
import { WalletTransaction } from "../domain/WalletTransactions";

export class TransactionFactory {
  static wallet(from: number, to: number, amount: number): WalletTransaction {
    return new WalletTransaction(from, to, amount);
  }

  static bank(
    from: number,
    account: BankAccount,
    amount: number,
  ): BankTransaction {
    return new BankTransaction(from, account, amount);
  }

  static refund(original: Transaction): RefundTransaction {
    return new RefundTransaction(original);
  }
}
