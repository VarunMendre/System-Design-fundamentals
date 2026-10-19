import { Payment } from "../domain/Payment";

export interface PaymentMethod {
  readonly mode: Payment;
  pay(amount: number): boolean;
}

