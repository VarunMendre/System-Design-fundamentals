import { Payment } from "../domain/Payment";
import { PaymentRepository } from "./PaymentRepository";

export class InMemoryPaymentRepository implements PaymentRepository {
    private payments: Payment[] = [];
    private nextId = 1;

    save(payment: Payment): Payment {
        if (payment.id === 0) {
            payment.id = this.nextId++;
            this.payments.push(payment);
        }

        return payment;
    }

    findByTransaction(txnId: number): Payment[] {
        return this.payments.filter((p) => p.transactionId === txnId);
    }
}

