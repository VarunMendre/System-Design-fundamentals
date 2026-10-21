import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "./helper";
import { STARTING_BALANCE } from "../src/config/constants";
import { PaymentStatus, TransactionStatus } from "../src/domain/enums";
import { CardPayment } from "../src/payments/CardPayment";

let app: ReturnType<typeof buildApp>;

beforeEach(() => {
  app = buildApp();
  app.cli.execute("RegisterUser 9876543210 secret1");
  app.cli.execute("RegisterUser 9876543211 secret2");
});

describe("input hardening", () => {
  it("rejects ids that are not plain positive integers", () => {
    for (const bad of ["1e2", "0x10", "-1", "1.5", "0", "abc"]) {
      expect(app.cli.execute(`UpdateUser ${bad} Asha a@b.com`)).toBe(
        `Error: Invalid user_id: ${bad}`,
      );
    }
  });

  it("enforces amount limits and formats", () => {
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 100000")).toContain(
      "status=PENDING",
    );
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 100000.01")).toBe(
      "Error: Amount cannot exceed ₹100000.00",
    );
    expect(
      app.cli.execute("CreateTransaction PAYTM 1 2 99999999999999999999999"),
    ).toContain("cannot exceed");
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 0")).toContain(
      "positive",
    );
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 0.00")).toContain(
      "positive",
    );
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 -5")).toBe(
      "Error: Invalid amount: -5",
    );
    expect(app.cli.execute("CreateTransaction PAYTM 1 2 1.005")).toBe(
      "Error: Invalid amount: 1.005",
    );
  });

  it("enforces name and email length limits from the schema", () => {
    expect(app.cli.execute(`UpdateUser 1 ${"a".repeat(101)} a@b.com`)).toBe(
      "Error: Name cannot exceed 100 characters",
    );
    expect(app.cli.execute(`UpdateUser 1 Asha ${"a".repeat(250)}@b.com`)).toBe(
      "Error: Email cannot exceed 255 characters",
    );
    expect(
      app.cli.execute(`UpdateUser 1 ${"a".repeat(100)} a@b.com`),
    ).toContain("Profile updated");
  });

  it("accepts lowercase sub-commands", () => {
    expect(app.cli.execute("createtransaction paytm 1 2 10")).toContain(
      "status=PENDING",
    );
  });

  it("known limitation: passwords cannot contain spaces", () => {
    expect(app.cli.execute("RegisterUser 9876543212 my secret pass")).toContain(
      "Usage",
    );
  });
});

describe("design rules", () => {
  it("creating a transaction does not reserve funds; balance is checked at payment time", () => {
    const t1 = app.txnSvc.createWallet(1, 2, 800_000);
    const t2 = app.txnSvc.createWallet(1, 2, 800_000); // both fit the creation checks
    const card = () => new CardPayment("4111111111111111", "12/30", "123");

    expect(app.paymentSvc.makePayment(t1.id, card()).payment.status).toBe(
      PaymentStatus.SUCCESS,
    );

    const second = app.paymentSvc.makePayment(t2.id, card());
    expect(second.payment.status).toBe(PaymentStatus.FAILED);
    expect(second.failureReason).toContain("Insufficient");
    expect(second.transaction.status).toBe(TransactionStatus.CANCELLED);
    expect(app.users.findById(1)!.balance).toBe(STARTING_BALANCE - 800_000);
  });
});
