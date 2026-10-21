import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "./helper";
import { STARTING_BALANCE } from "../src/config/constants";
import { TransactionStatus, TransactionType } from "../src/domain/enums";
import { CardPayment } from "../src/payments/CardPayment";

let app: ReturnType<typeof buildApp>;
let alice: number;
let bob: number;

const bal = (id: number) => app.users.findById(id)!.balance;
const card = () => new CardPayment("4111111111111111", "12/30", "123");
const declined = () => new CardPayment("4111111111110000", "12/30", "123");

function paidWallet(amount = 50_000) {
  const t = app.txnSvc.createWallet(alice, bob, amount);
  app.paymentSvc.makePayment(t.id, card());
  return t;
}

beforeEach(() => {
  app = buildApp();
  alice = app.userSvc.register("9876543210", "secret1").id;
  bob = app.userSvc.register("9876543211", "secret2").id;
});

describe("TransactionService.refund", () => {
  it("wallet refund: money goes back to the original sender", () => {
    const t = paidWallet();
    const r = app.txnSvc.refund(t.id);
    expect(r.type).toBe(TransactionType.REFUND);
    expect(r.status).toBe(TransactionStatus.CONFIRMED);
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);
  });

  it("bank refund: sender is credited back", () => {
    const t = app.txnSvc.createBank(
      alice,
      "123456789012",
      "HDFC0001234",
      20_000,
    );
    app.paymentSvc.makePayment(t.id, card());
    expect(bal(alice)).toBe(STARTING_BALANCE - 20_000);
    app.txnSvc.refund(t.id);
    expect(bal(alice)).toBe(STARTING_BALANCE);
  });

  it("cannot refund twice", () => {
    const t = paidWallet();
    app.txnSvc.refund(t.id);
    expect(() => app.txnSvc.refund(t.id)).toThrow("already refunded");
    expect(bal(alice)).toBe(STARTING_BALANCE); // no double credit
  });

  it("cannot refund PENDING or CANCELLED transactions", () => {
    const pending = app.txnSvc.createWallet(alice, bob, 100);
    expect(() => app.txnSvc.refund(pending.id)).toThrow("PENDING");

    const cancelled = app.txnSvc.createWallet(alice, bob, 100);
    app.paymentSvc.makePayment(cancelled.id, declined());
    expect(() => app.txnSvc.refund(cancelled.id)).toThrow("CANCELLED");
  });

  it("cannot refund a refund or an unknown transaction", () => {
    const t = paidWallet();
    const r = app.txnSvc.refund(t.id);
    expect(() => app.txnSvc.refund(r.id)).toThrow("cannot be refunded");
    expect(() => app.txnSvc.refund(99)).toThrow("not found");
  });

  it("fails cleanly if the receiver already spent the money", () => {
    const t = paidWallet();
    app.users.findById(bob)!.debit(bal(bob)); // bob spends everything
    const aliceBefore = bal(alice);

    expect(() => app.txnSvc.refund(t.id)).toThrow("Receiver");
    expect(bal(alice)).toBe(aliceBefore); // nothing moved
    expect(app.txns.findRefundOf(t.id)).toBeUndefined(); // no refund record left behind
    expect(t.isRefundable()).toBe(true); // can be retried later
  });
});

describe("TransactionService.history", () => {
  it("sender and receiver both see the transaction; newest first", () => {
    const t1 = paidWallet(10_000);
    const t2 = paidWallet(20_000);
    expect(app.txnSvc.history(alice).map((t) => t.id)).toEqual([t2.id, t1.id]);
    expect(app.txnSvc.history(bob).map((t) => t.id)).toEqual([t2.id, t1.id]);
  });

  it("includes refunds for both the original sender and receiver", () => {
    const t = paidWallet();
    const r = app.txnSvc.refund(t.id);
    expect(app.txnSvc.history(alice).map((x) => x.id)).toContain(r.id);
    expect(app.txnSvc.history(bob).map((x) => x.id)).toContain(r.id);
  });

  it("includes PENDING and CANCELLED transactions too", () => {
    app.txnSvc.createWallet(alice, bob, 100);
    const c = app.txnSvc.createWallet(alice, bob, 100);
    app.paymentSvc.makePayment(c.id, declined());
    expect(app.txnSvc.history(alice)).toHaveLength(2);
  });

  it("bank transactions appear only for the sender", () => {
    app.txnSvc.createBank(alice, "123456789012", "HDFC0001234", 100);
    expect(app.txnSvc.history(alice)).toHaveLength(1);
    expect(app.txnSvc.history(bob)).toHaveLength(0);
  });

  it("rejects an unknown user", () => {
    expect(() => app.txnSvc.history(99)).toThrow("not found");
  });
});

describe("CLI refund + history", () => {
  beforeEach(() => {
    app.cli.execute("CreateTransaction PAYTM 1 2 500");
    app.cli.execute("MakePayment 1 CARD 4111111111111111 12/30 123");
  });

  it("refunds and restores balances", () => {
    expect(app.cli.execute("RefundTransaction 1")).toBe(
      "Refund processed. refund_id=2 original_txn_id=1 amount=₹500.00 status=CONFIRMED",
    );
    expect(app.cli.execute("ShowBalance 1")).toBe("User 1 balance: ₹10000.00");
    expect(app.cli.execute("ShowBalance 2")).toBe("User 2 balance: ₹10000.00");
    expect(app.cli.execute("RefundTransaction 1")).toBe(
      "Error: Transaction 1 is already refunded",
    );
  });

  it("shows history from each user point of view", () => {
    app.cli.execute("RefundTransaction 1");
    expect(app.cli.execute("ViewTransactionsHistory 1").split("\n")).toEqual([
      "#2 | REFUND | ₹500.00 | CONFIRMED | refund of #1 (credited)",
      "#1 | WALLET_TO_WALLET | ₹500.00 | CONFIRMED | sent to user 2",
    ]);
    expect(app.cli.execute("ViewTransactionsHistory 2").split("\n")).toEqual([
      "#2 | REFUND | ₹500.00 | CONFIRMED | refund of #1 (debited)",
      "#1 | WALLET_TO_WALLET | ₹500.00 | CONFIRMED | received from user 1",
    ]);
  });

  it("handles empty history, bank lines and bad input", () => {
    app.userSvc.register("9876543212", "secret3");
    expect(app.cli.execute("ViewTransactionsHistory 3")).toBe(
      "No transactions",
    );

    app.cli.execute("CreateTransaction BANK 1 123456789012 HDFC0001234 100");
    expect(app.cli.execute("ViewTransactionsHistory 1").split("\n")[0]).toBe(
      "#2 | WALLET_TO_BANK | ₹100.00 | PENDING | sent to bank ****9012 (HDFC0001234)",
    );
    expect(app.cli.execute("ViewTransactionsHistory abc")).toBe(
      "Error: Invalid user_id: abc",
    );
    expect(app.cli.execute("RefundTransaction 2")).toContain("PENDING");
  });
});
