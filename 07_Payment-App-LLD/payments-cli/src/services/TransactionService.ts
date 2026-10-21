import { AppError } from "../errors/AppError";
import { BankAccount } from "../domain/BankAccount";
import { Transaction } from "../domain/Transaction";
import { TransactionFactory } from "../factories/TransactionFactory";
import { BankAccountRepository } from "../repositories/BankAccountRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { UserRepository } from "../repositories/UserRepository";
import { assertValidAmount } from "../utils/money";
import { TransactionStatus, TransactionType } from "../domain/enums";

const ACCOUNT_RE = /^\d{9,18}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export class TransactionService {
  constructor(
    private users: UserRepository,
    private banks: BankAccountRepository,
    private txns: TransactionRepository,
  ) {}

  // Creates a PENDING transaction. No money moves until payment succeeds.
  createWallet(from: number, to: number, amount: number): Transaction {
    assertValidAmount(amount);

    if (from === to) throw new AppError("Cannot send money to yourself");

    if (!this.users.findById(from))
      throw new AppError(`User ${from} not found`);

    if (!this.users.findById(to)) throw new AppError(`User ${to} not found`);

    return this.txns.save(TransactionFactory.wallet(from, to, amount));
  }

  createBank(
    from: number,
    accountNumber: string,
    ifsc: string,
    amount: number,
  ): Transaction {
    assertValidAmount(amount);
    if (!this.users.findById(from))
      throw new AppError(`User ${from} not found`);

    if (!ACCOUNT_RE.test(accountNumber))
      throw new AppError("Account number must be 9 to 18 digits");

    const code = ifsc.toUpperCase();
    if (!IFSC_RE.test(code)) throw new AppError("Invalid IFSC code");

    const account =
      this.banks.findByAccountNumberAndIfsc(accountNumber, code) ??
      this.banks.save(new BankAccount(accountNumber, code));

    return this.txns.save(TransactionFactory.bank(from, account, amount));
  }

  refund(txnId: number): Transaction {
    const original = this.txns.findById(txnId);
    if (!original) throw new AppError(`Transaction ${txnId} not found`);

    if (original.type === TransactionType.REFUND)
      throw new AppError(`A refund cannot be refunded`);

    if (original.status != TransactionStatus.CONFIRMED)
      throw new AppError(
        `Only CONFIRMED transactions can be refunded (transaction ${txnId} is ${original.status})`,
      );

    if (this.txns.findRefundOf(txnId))
      throw new AppError(`Transaction ${txnId} is already refunded`);

    const refund = TransactionFactory.refund(original);
    refund.settle(this.users);
    refund.confirm();

    return this.txns.save(refund);
  }

  history(userId: number): Transaction[] {
    if (!this.users.findById(userId))
      throw new AppError(`User ${userId} not found`);

    return this.txns.findByUser(userId).sort((a, b) => b.id - a.id);
  }
}


