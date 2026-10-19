import { AppError } from "../errors/AppError";
import { PaymentMode } from "../domain/enums";
import { PaymentMethod } from "./PaymentMethod";

export class CardPayment implements PaymentMethod {
  readonly mode: PaymentMethod["mode"] =
    PaymentMode.CARD as unknown as PaymentMethod["mode"];

  constructor(cardNo: string, expiry: string, cvv: string) {
    if (!/^\d{16}$/.test(cardNo))
      throw new AppError("Card number must be 16 digits");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry))
      throw new AppError("Expiry must be MM/YY");
    if (!/^\d{3}$/.test(cvv)) throw new AppError("CVV must be 3 digits");

    const [mm, yy] = expiry.split("/").map(Number);
    const endOfExpiryMonth = new Date(2000 + yy, mm, 0, 23, 59, 59);
    if (endOfExpiryMonth < new Date()) throw new AppError("Card has expired");

    this.cardNo = cardNo;
  }

  private readonly cardNo: string;

  //  rule: cards ending in 0000 are declined.
  pay(_amount: number): boolean {
    return !this.cardNo.endsWith("0000");
  }
}
