import { RefundTransaction } from "../domain/RefundTransaction";
import { Transaction } from "../domain/Transaction";
import { TransactionRepository } from "./TransactionRepository";

export class InMemoryTransactionRepository implements TransactionRepository {
  private txns = new Map<number, Transaction>();
  private nextId = 1;

  save(txn: Transaction): Transaction {
    if (txn.id === 0) txn.id = this.nextId++;
    this.txns.set(txn.id, txn);
    return txn;
  }

  findById(id: number): Transaction | undefined {
    return this.txns.get(id);
  }

  findByUser(userId: number): Transaction[] {
    return [...this.txns.values()].filter((t) => t.involves(userId));
  }

  findRefundOf(originalId: number): RefundTransaction | undefined {
    return [...this.txns.values()].find(
      (t): t is RefundTransaction =>
        t instanceof RefundTransaction &&
        t.originalTransaction.id === originalId,
    );
  }
}
