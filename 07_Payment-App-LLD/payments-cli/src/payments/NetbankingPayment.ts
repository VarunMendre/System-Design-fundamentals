import { PaymentMode } from "../domain/enums";
import { AppError } from "../errors/AppError";
import { PaymentMethod } from "./PaymentMethod";

export class NetbankingPayment implements PaymentMethod {
  readonly mode: PaymentMethod["mode"] =
    PaymentMode.NETBANKING as unknown as PaymentMethod["mode"];

  constructor(
    private readonly bank: string,
    private readonly username: string,
  ) {
    if (!bank.trim()) throw new AppError("Bank name is required");
    if (!username.trim()) throw new AppError("Username is required");
  }

  pay(amount: number): boolean {
    return this.username.toLowerCase() !== "fail";
  }
}
