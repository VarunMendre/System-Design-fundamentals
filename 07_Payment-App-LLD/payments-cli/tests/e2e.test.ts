import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";

// Starts the real app, pipes commands to stdin, returns the non-empty stdout lines.
function runCli(commands: string[]): string[] {
  const r = spawnSync(process.execPath, ["--import", "tsx", "src/main.ts"], {
    input: commands.join("\n") + "\nexit\n",
    encoding: "utf8",
    cwd: process.cwd(),
    timeout: 30_000,
  });
  if (r.status !== 0)
    throw new Error(`CLI exited with ${r.status}: ${r.stderr}`);
  return r.stdout.split(/\r?\n/).filter((l) => l !== "");
}

const T = 30_000; // each test starts a process

describe("end-to-end", () => {
  it(
    "happy path: pay, bank transfer, refund both, check history",
    () => {
      const out = runCli([
        "RegisterUser 9876543210 secret1",
        "RegisterUser 9876543211 secret2",
        "UpdateUser 1 Asha Rao asha@example.com",
        "CreateTransaction PAYTM 1 2 500",
        "MakePayment 1 CARD 4111111111111111 12/30 123",
        "ShowBalance 1",
        "ShowBalance 2",
        "CreateTransaction BANK 1 123456789012 HDFC0001234 250.50",
        "MakePayment 2 UPI asha@okbank",
        "ShowBalance 1",
        "RefundTransaction 2",
        "RefundTransaction 1",
        "ShowBalance 1",
        "ShowBalance 2",
        "ViewTransactionsHistory 1",
      ]);

      expect(out).toEqual([
        "User registered. id=1",
        "User registered. id=2",
        "Profile updated. id=1 name=Asha Rao email=asha@example.com",
        "Transaction created. id=1 type=WALLET_TO_WALLET amount=₹500.00 status=PENDING",
        "Payment SUCCESS. payment_id=1 txn_id=1 txn_status=CONFIRMED",
        "User 1 balance: ₹9500.00",
        "User 2 balance: ₹10500.00",
        "Transaction created. id=2 type=WALLET_TO_BANK amount=₹250.50 status=PENDING",
        "Payment SUCCESS. payment_id=2 txn_id=2 txn_status=CONFIRMED",
        "User 1 balance: ₹9249.50",
        "Refund processed. refund_id=3 original_txn_id=2 amount=₹250.50 status=CONFIRMED",
        "Refund processed. refund_id=4 original_txn_id=1 amount=₹500.00 status=CONFIRMED",
        "User 1 balance: ₹10000.00",
        "User 2 balance: ₹10000.00",
        "#4 | REFUND | ₹500.00 | CONFIRMED | refund of #1 (credited)",
        "#3 | REFUND | ₹250.50 | CONFIRMED | refund of #2 (credited)",
        "#2 | WALLET_TO_BANK | ₹250.50 | CONFIRMED | sent to bank ****9012 (HDFC0001234)",
        "#1 | WALLET_TO_WALLET | ₹500.00 | CONFIRMED | sent to user 2",
      ]);
    },
    T,
  );

  it(
    "failure path: validation errors, declined payment, nothing moves",
    () => {
      const out = runCli([
        "RegisterUser 9876543210 secret1",
        "RegisterUser 9876543211 secret2",
        "RegisterUser 9876543210 secret3",
        "CreateTransaction PAYTM 1 1 100",
        "CreateTransaction PAYTM 1 9 100",
        "CreateTransaction PAYTM 1 2 100000.01",
        "CreateTransaction PAYTM 1 2 100",
        "MakePayment 1 UPI fail@bank",
        "MakePayment 1 UPI asha@bank",
        "RefundTransaction 1",
        "ShowBalance 1",
        "Foo",
      ]);

      expect(out).toEqual([
        "User registered. id=1",
        "User registered. id=2",
        "Error: Phone number already registered",
        "Error: Cannot send money to yourself",
        "Error: User 9 not found",
        "Error: Amount cannot exceed ₹100000.00",
        "Transaction created. id=1 type=WALLET_TO_WALLET amount=₹100.00 status=PENDING",
        "Payment FAILED (Declined by payment provider). payment_id=1 txn_id=1 txn_status=CANCELLED",
        "Error: Transaction 1 is already CANCELLED",
        "Error: Only CONFIRMED transactions can be refunded (transaction 1 is CANCELLED)",
        "User 1 balance: ₹10000.00",
        "Unknown command: Foo",
      ]);
    },
    T,
  );

  it(
    "insufficient balance: payment approved but transaction cancelled",
    () => {
      const out = runCli([
        "RegisterUser 9876543210 secret1",
        "RegisterUser 9876543211 secret2",
        "CreateTransaction PAYTM 1 2 100000", // more than the ₹10,000 starting balance
        "MakePayment 1 UPI asha@okbank",
        "ShowBalance 1",
        "ShowBalance 2",
      ]);

      expect(out.slice(3)).toEqual([
        "Payment FAILED (Insufficient balance). payment_id=1 txn_id=1 txn_status=CANCELLED",
        "User 1 balance: ₹10000.00",
        "User 2 balance: ₹10000.00",
      ]);
    },
    T,
  );

  it(
    "refund rules: no double refund, no refund of a refund, both histories",
    () => {
      const out = runCli([
        "RegisterUser 9876543210 secret1",
        "RegisterUser 9876543211 secret2",
        "CreateTransaction PAYTM 1 2 500",
        "MakePayment 1 UPI asha@okbank",
        "RefundTransaction 1",
        "RefundTransaction 1",
        "RefundTransaction 2",
        "ViewTransactionsHistory 2",
        "ShowBalance 1",
        "ShowBalance 2",
      ]);

      expect(out.slice(4)).toEqual([
        "Refund processed. refund_id=2 original_txn_id=1 amount=₹500.00 status=CONFIRMED",
        "Error: Transaction 1 is already refunded",
        "Error: A refund cannot be refunded",
        "#2 | REFUND | ₹500.00 | CONFIRMED | refund of #1 (debited)",
        "#1 | WALLET_TO_WALLET | ₹500.00 | CONFIRMED | received from user 1",
        "User 1 balance: ₹10000.00",
        "User 2 balance: ₹10000.00",
      ]);
    },
    T,
  );
});
