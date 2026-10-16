import { RefundTransaction } from "../domain/RefundTransaction";
import { Transaction } from "../domain/Transaction";

export interface TransactionRepository {
  save(txn: Transaction): Transaction;
  findById(id: number): Transaction | undefined;
  findByUser(userId: number): Transaction[];
  findRefundOf(originalId: number): RefundTransaction | undefined;
}
