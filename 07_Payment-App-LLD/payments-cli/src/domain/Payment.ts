import { PaymentMode, PaymentStatus } from "./enums";

export class Payment {
    id = 0;
    readonly createdAt = new Date();

    constructor(
        public readonly transactionId: number,
        public readonly amount: number,
        public readonly mode: PaymentMode,
        public readonly status: PaymentStatus,
    ) {
        
    }
}