import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "./helper";
import { STARTING_BALANCE } from "../src/config/constants";
import { PaymentStatus, TransactionStatus } from "../src/domain/enums";
import { CardPayment } from "../src/payments/CardPayment";
import { UpiPayment } from "../src/payments/UpiPayment";
import { NetbankingPayment } from "../src/payments/NetbankingPayment";
import { PaymentMethodFactory } from "../src/payments/PaymentMethodFactory";

let app: ReturnType<typeof buildApp>;
let alice: number;
let bob: number;

const bal = (id: number) => app.users.findById(id)!.balance;
const goodCard = () => new CardPayment("4111111111111111", "12/30", "123");
const badCard = () => new CardPayment("4111111111110000", "12/30", "123"); // mock: declined

beforeEach(() => {
  app = buildApp();
  alice = app.userSvc.register("9876543210", "secret1").id;
  bob = app.userSvc.register("9876543211", "secret2").id;
});

describe("PaymentService.makePayment", () => {
  it("success: txn CONFIRMED, balances move, payment recorded", () => {
    const t = app.txnSvc.createWallet(alice, bob, 50_000);
    const r = app.paymentSvc.makePayment(t.id, goodCard());
    expect(r.payment.status).toBe(PaymentStatus.SUCCESS);
    expect(r.transaction.status).toBe(TransactionStatus.CONFIRMED);
    expect(bal(alice)).toBe(STARTING_BALANCE - 50_000);
    expect(bal(bob)).toBe(STARTING_BALANCE + 50_000);
    expect(app.payments.findByTransaction(t.id)).toHaveLength(1);
  });

  it("declined payment: txn CANCELLED, balances untouched, FAILED payment saved", () => {
    const t = app.txnSvc.createWallet(alice, bob, 50_000);
    const r = app.paymentSvc.makePayment(t.id, badCard());
    expect(r.payment.status).toBe(PaymentStatus.FAILED);
    expect(r.transaction.status).toBe(TransactionStatus.CANCELLED);
    expect(r.failureReason).toContain("Declined");
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);
  });

  it("approved but insufficient balance: txn CANCELLED, nothing moves", () => {
    const t = app.txnSvc.createWallet(alice, bob, STARTING_BALANCE + 1);
    const r = app.paymentSvc.makePayment(t.id, goodCard());
    expect(r.payment.status).toBe(PaymentStatus.FAILED);
    expect(r.transaction.status).toBe(TransactionStatus.CANCELLED);
    expect(r.failureReason).toContain("Insufficient");
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);
  });

  it("bank transaction: sender debited on success", () => {
    const t = app.txnSvc.createBank(
      alice,
      "123456789012",
      "HDFC0001234",
      20_000,
    );
    app.paymentSvc.makePayment(t.id, new UpiPayment("alice@okbank"));
    expect(bal(alice)).toBe(STARTING_BALANCE - 20_000);
  });

  it("cannot pay twice (no double debit)", () => {
    const t = app.txnSvc.createWallet(alice, bob, 50_000);
    app.paymentSvc.makePayment(t.id, goodCard());
    expect(() => app.paymentSvc.makePayment(t.id, goodCard())).toThrow(
      "already CONFIRMED",
    );
    expect(bal(alice)).toBe(STARTING_BALANCE - 50_000);
  });

  it("cannot pay a cancelled transaction", () => {
    const t = app.txnSvc.createWallet(alice, bob, 50_000);
    app.paymentSvc.makePayment(t.id, badCard());
    expect(() => app.paymentSvc.makePayment(t.id, goodCard())).toThrow(
      "already CANCELLED",
    );
  });

  it("rejects unknown txn and mismatched amount", () => {
    expect(() => app.paymentSvc.makePayment(99, goodCard())).toThrow(
      "not found",
    );
    const t = app.txnSvc.createWallet(alice, bob, 50_000);
    expect(() => app.paymentSvc.makePayment(t.id, goodCard(), 100)).toThrow(
      "must equal",
    );
    expect(t.status).toBe(TransactionStatus.PENDING);
  });
});

describe("payment methods", () => {
  it("validate their details", () => {
    expect(() => new CardPayment("123", "12/30", "123")).toThrow("16 digits");
    expect(() => new CardPayment("4111111111111111", "13/30", "123")).toThrow(
      "MM/YY",
    );
    expect(() => new CardPayment("4111111111111111", "12/30", "12")).toThrow(
      "CVV",
    );
    expect(() => new CardPayment("4111111111111111", "01/20", "123")).toThrow(
      "expired",
    );
    expect(() => new UpiPayment("nope")).toThrow("Invalid UPI");
    expect(() => new NetbankingPayment("", "user")).toThrow("Bank");
  });

  it("mock decline rules", () => {
    expect(new UpiPayment("fail@bank").pay(100)).toBe(false);
    expect(new UpiPayment("asha@bank").pay(100)).toBe(true);
    expect(new NetbankingPayment("HDFC", "fail").pay(100)).toBe(false);
    expect(new NetbankingPayment("HDFC", "asha").pay(100)).toBe(true);
  });

  it("factory builds by mode and rejects bad input", () => {
    expect(PaymentMethodFactory.create("upi", ["a@b"]).mode).toBe("UPI");
    expect(() => PaymentMethodFactory.create("CRYPTO", [])).toThrow(
      "Unknown payment method",
    );
    expect(() => PaymentMethodFactory.create("CARD", ["1"])).toThrow("Usage");
  });

  it("invalid details never touch the transaction", () => {
    const t = app.txnSvc.createWallet(alice, bob, 100);
    expect(() =>
      app.cli.execute("MakePayment 1 CARD 123 12/30 123"),
    ).not.toThrow();
    expect(t.status).toBe(TransactionStatus.PENDING);
  });
});

describe("CLI MakePayment", () => {
  it("runs the full flow", () => {
    app.cli.execute("CreateTransaction PAYTM 1 2 500");
    expect(
      app.cli.execute("MakePayment 1 CARD 4111111111111111 12/30 123"),
    ).toBe("Payment SUCCESS. payment_id=1 txn_id=1 txn_status=CONFIRMED");
    expect(app.cli.execute("ShowBalance 1")).toBe("User 1 balance: ₹9500.00");
    expect(app.cli.execute("ShowBalance 2")).toBe("User 2 balance: ₹10500.00");
  });

  it("shows failures clearly", () => {
    app.cli.execute("CreateTransaction PAYTM 1 2 500");
    expect(app.cli.execute("MakePayment 1 UPI fail@bank")).toBe(
      "Payment FAILED (Declined by payment provider). payment_id=1 txn_id=1 txn_status=CANCELLED",
    );
    expect(app.cli.execute("MakePayment 1 UPI asha@bank")).toBe(
      "Error: Transaction 1 is already CANCELLED",
    );
  });
});
