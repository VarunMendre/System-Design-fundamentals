import { AppError } from "../errors/AppError";
import { Payment } from "../domain/Payment";
import { Transaction } from "../domain/Transaction";
import { PaymentStatus, TransactionStatus } from "../domain/enums";
import { PaymentMethod } from "../payments/PaymentMethod";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { UserRepository } from "../repositories/UserRepository";

export interface PaymentResult {
  payment: Payment;
  transaction: Transaction;
  failureReason?: string;
}

export class PaymentService {
  constructor(
    private txns: TransactionRepository,
    private payments: PaymentRepository,
    private users: UserRepository,
  ) {}

  makePayment(
    txnId: number,
    method: PaymentMethod,
    amount?: number,
  ): PaymentResult {
    const txn = this.txns.findById(txnId);
    if (!txn) throw new AppError(`Transaction ${txnId} not found`);
    if (txn.status !== TransactionStatus.PENDING) {
      throw new AppError(`Transaction ${txnId} is already ${txn.status}`);
    }

    const payAmount = amount ?? txn.amount;
    if (payAmount !== txn.amount) {
      throw new AppError("Payment amount must equal the transaction amount");
    }

    let failureReason: string | undefined;
    if (!method.pay(payAmount)) {
      failureReason = "Declined by payment provider";
    } else {
      try {
        txn.settle(this.users); // validates first, so a failure leaves balances untouched
      } catch (e) {
        if (!(e instanceof AppError)) throw e;
        failureReason = e.message; // e.g. insufficient balance
      }
    }

    const success = failureReason === undefined;
    if (success) txn.confirm();
    else txn.cancel();
    this.txns.save(txn);

    const payment = this.payments.save(
      new Payment(
        txn.id,
        payAmount,
        method.mode.mode,
        success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      ),
    );
    return { payment, transaction: txn, failureReason };
  }
}
