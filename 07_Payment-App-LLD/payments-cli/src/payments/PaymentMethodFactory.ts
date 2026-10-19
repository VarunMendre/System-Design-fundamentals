import { AppError } from "../errors/AppError";
import { CardPayment } from "./CardPayment";
import { NetbankingPayment } from "./NetbankingPayment";
import { PaymentMethod } from "./PaymentMethod";
import { UpiPayment } from "./UpiPayment";

export class PaymentMethodFactory {
  static create(mode: string, d: string[]): PaymentMethod {
    switch (mode.toUpperCase()) {
      case "CARD":
        PaymentMethodFactory.need(d, 3, "CARD <card_no> <MM/YY> <cvv>");
        return new CardPayment(d[0], d[1], d[2]);
      case "UPI":
        PaymentMethodFactory.need(d, 1, "UPI <upi_id>");
        return new UpiPayment(d[0]);
      case "NETBANKING":
        PaymentMethodFactory.need(d, 2, "NETBANKING <bank> <username>");
        return new NetbankingPayment(d[0], d[1]);
      default:
        throw new AppError(
          `Unknown payment method: ${mode} (use CARD, UPI or NETBANKING)`,
        );
    }
  }

  private static need(d: string[], n: number, usage: string): void {
    if (d.length !== n)
      throw new AppError(`Usage: MakePayment <txn_id> ${usage}`);
  }
}
