import { PaymentMode } from "../domain/enums";
import { AppError } from "../errors/AppError";
import { PaymentMethod } from "./PaymentMethod";

export class UpiPayment implements PaymentMethod {
  readonly mode: PaymentMethod["mode"] =
    PaymentMode.UPI as unknown as PaymentMethod["mode"];

  constructor(private readonly upiId: string) {
    if (!/^[\w.-]+@[\w-]+$/.test(upiId))
      throw new AppError("Invalid UPI id (expected name@bank)");
  }

  pay(amount: number): boolean {
    return !this.upiId.toLowerCase().startsWith("fail");
  }
}

