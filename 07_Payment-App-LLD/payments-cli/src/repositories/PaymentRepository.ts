import { Payment } from "../domain/Payment";

export interface PaymentRepository {
  save(payment: Payment): Payment;
  findByTransaction(txnId: number): Payment[];
}


