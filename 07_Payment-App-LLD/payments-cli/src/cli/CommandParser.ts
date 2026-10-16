import { AppError } from "../errors/AppError";
import { UserService } from "../services/UserService";
import { TransactionService } from "../services/TransactionService";
import { formatRupees, rupeesToPaise } from "../utils/money";
import { Transaction } from "../domain/Transaction";

type Handler = (args: string[]) => string;

export class CommandParser {
  private handlers = new Map<string, Handler>();

  constructor(
    private userSvc: UserService,
    private txnSvc: TransactionService,
  ) {
    this.register("REGISTERUSER", (a) => this.registerUser(a));
    this.register("UPDATEUSER", (a) => this.updateUser(a));
    this.register("CREATETRANSACTION", (a) => this.createTransaction(a));
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
}
