import { AppError } from "../errors/AppError";
import { UserService } from "../services/UserService";
import { TransactionService } from "../services/TransactionService";
import { formatRupees, rupeesToPaise } from "../utils/money";
import { Transaction } from "../domain/Transaction";
import { PaymentService } from "../services/PaymentService";
import { PaymentMethodFactory } from "../payments/PaymentMethodFactory";
import { PaymentStatus } from "../domain/enums";
import { WalletTransaction } from "../domain/WalletTransactions"; 
import { BankTransaction } from "../domain/BankTransaction";
import { RefundTransaction } from "../domain/RefundTransaction";

type Handler = (args: string[]) => string;

export class CommandParser {
  private handlers = new Map<string, Handler>();

  constructor(
    private userSvc: UserService,
    private txnSvc: TransactionService,
    private paymentSvc: PaymentService,
  ) {
    this.register("REGISTERUSER", (a) => this.registerUser(a));
    this.register("UPDATEUSER", (a) => this.updateUser(a));
    this.register("CREATETRANSACTION", (a) => this.createTransaction(a));
    this.register("MAKEPAYMENT", (a) => this.makePayment(a));
    this.register("SHOWBALANCE", (a) => this.showBalance(a)); // extra: lets you verify money moved
    this.register("REFUNDTRANSACTION", (a) => this.refundTransaction(a));
    this.register("VIEWTRANSACTIONSHISTORY", (a) => this.viewHistory(a));
  }

  register(name: string, handler: Handler): void {
    this.handlers.set(name.toUpperCase(), handler);
  }

  execute(line: string): string {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return "";

    const [cmd, ...args] = tokens;
    const handler = this.handlers.get(cmd.toUpperCase());
    if (!handler) return `Unknown command: ${cmd}`;

    try {
      return handler(args);
    } catch (e) {
      if (e instanceof AppError) return `Error: ${e.message}`;
      console.error(e);
      return "Error: something went wrong";
    }
  }

  // MakePayment <txn_id> CARD <card_no> <MM/YY> <cvv>
  // MakePayment <txn_id> UPI <upi_id>
  // MakePayment <txn_id> NETBANKING <bank> <username>
  private makePayment(args: string[]): string {
    if (args.length < 2) {
      throw new AppError(
        "Usage: MakePayment <txn_id> <CARD|UPI|NETBANKING> <details...>",
      );
    }
    const txnId = this.parseId(args[0], "txn_id");
    const method = PaymentMethodFactory.create(args[1], args.slice(2));
    const { payment, transaction, failureReason } = this.paymentSvc.makePayment(
      txnId,
      method,
    );

    const head =
      payment.status === PaymentStatus.SUCCESS
        ? "Payment SUCCESS"
        : `Payment FAILED (${failureReason})`;
    return `${head}. payment_id=${payment.id} txn_id=${transaction.id} txn_status=${transaction.status}`;
  }

  // ShowBalance <user_id>
  private showBalance(args: string[]): string {
    this.expectArgs(args, 1, "ShowBalance <user_id>");
    const user = this.userSvc.getUser(this.parseId(args[0], "user_id"));
    return `User ${user.id} balance: ${formatRupees(user.balance)}`;
  }
  // ---------- commands ----------

  private registerUser(args: string[]): string {
    this.expectArgs(args, 2, "RegisterUser <phone> <password>");
    const user = this.userSvc.register(args[0], args[1]);
    return `User registered. id=${user.id}`;
  }

  private updateUser(args: string[]): string {
    if (args.length < 3)
      throw new AppError("Usage: UpdateUser <user_id> <name> <email>");
    const id = this.parseId(args[0], "user_id");
    const email = args[args.length - 1];
    const name = args.slice(1, -1).join(" ");
    const user = this.userSvc.updateProfile(id, name, email);
    return `Profile updated. id=${user.id} name=${user.name} email=${user.email}`;
  }

  // CreateTransaction PAYTM <from_user_id> <to_user_id> <amount>
  // CreateTransaction BANK  <from_user_id> <account_number> <ifsc> <amount>
  private createTransaction(args: string[]): string {
    const kind = args[0]?.toUpperCase();
    let txn: Transaction;

    if (kind === "PAYTM") {
      this.expectArgs(
        args,
        4,
        "CreateTransaction PAYTM <from_user_id> <to_user_id> <amount>",
      );
      txn = this.txnSvc.createWallet(
        this.parseId(args[1], "from_user_id"),
        this.parseId(args[2], "to_user_id"),
        this.parseAmount(args[3]),
      );
    } else if (kind === "BANK") {
      this.expectArgs(
        args,
        5,
        "CreateTransaction BANK <from_user_id> <account_number> <ifsc> <amount>",
      );
      txn = this.txnSvc.createBank(
        this.parseId(args[1], "from_user_id"),
        args[2],
        args[3],
        this.parseAmount(args[4]),
      );
    } else {
      throw new AppError("Usage: CreateTransaction PAYTM|BANK ...");
    }

    return `Transaction created. id=${txn.id} type=${txn.type} amount=${formatRupees(txn.amount)} status=${txn.status}`;
  }

  // ---------- helpers ----------

  private expectArgs(args: string[], count: number, usage: string): void {
    if (args.length !== count) throw new AppError(`Usage: ${usage}`);
  }

  private parseId(raw: string, label: string): number {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0)
      throw new AppError(`Invalid ${label}: ${raw}`);
    return n;
  }

  // The CLI takes rupees (up to 2 decimals); the domain works in paise.
  private parseAmount(raw: string): number {
    if (!/^\d+(\.\d{1,2})?$/.test(raw))
      throw new AppError(`Invalid amount: ${raw}`);
    return rupeesToPaise(Number(raw));
  }

  // RefundTransaction <txn_id>
  private refundTransaction(args: string[]): string {
    this.expectArgs(args, 1, "RefundTransaction <txn_id>");
    const original = this.parseId(args[0], "txn_id");
    const refund = this.txnSvc.refund(original);
    return `Refund processed. refund_id=${refund.id} original_txn_id=${original} amount=${formatRupees(refund.amount)} status=${refund.status}`;
  }

  // ViewTransactionsHistory <user_id>
  private viewHistory(args: string[]): string {
    this.expectArgs(args, 1, "ViewTransactionsHistory <user_id>");
    const userId = this.parseId(args[0], "user_id");
    const list = this.txnSvc.history(userId);
    if (list.length === 0) return "No transactions";
    return list.map((t) => this.formatTxn(t, userId)).join("\n");
  }

  // One line per transaction, described from the point of view of the user asking.
  private formatTxn(t: Transaction, userId: number): string {
    let detail: string;
    if (t instanceof WalletTransaction) {
      detail =
        t.fromUserId === userId
          ? `sent to user ${t.toUserId}`
          : `received from user ${t.fromUserId}`;
    } else if (t instanceof BankTransaction) {
      detail = `sent to bank ****${t.bankAccount.accountNumber.slice(-4)} (${t.bankAccount.ifsc})`;
    } else if (t instanceof RefundTransaction) {
      const o = t.originalTransaction;
      const debited = o instanceof WalletTransaction && o.toUserId === userId;
      detail = `refund of #${o.id} (${debited ? "debited" : "credited"})`;
    } else {
      detail = "";
    }
    return `#${t.id} | ${t.type} | ${formatRupees(t.amount)} | ${t.status} | ${detail}`;
  }
}
