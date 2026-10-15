import { AppError } from "../errors/AppError";
import { UserService } from "../services/UserService";

type Handler = (args: string[]) => string;

export class CommandParser {
  private handlers = new Map<string, Handler>();

  constructor(private userSvc: UserService) {
    this.register("REGISTERUSER", (a) => this.registerUser(a));
    this.register("UPDATEUSER", (a) => this.updateUser(a));
  }

  register(name: string, handler: Handler) {
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
      console.error(e); // a real bug, not a business-rule failure
      return "Error: something went wrong";
    }
  }

  // RegisterUser <phone> <password>
  private registerUser(args: string[]): string {
    this.expectArgs(args, 2, "RegisterUser <phone> <password>");
    const user = this.userSvc.register(args[0], args[1]);
    return `User registered. id=${user.id}`;
  }

  // UpdateUser <user_id> <name> <email>   (the name may contain spaces)
  private updateUser(args: string[]): string {
    if (args.length < 3)
      throw new AppError("Usage: UpdateUser <user_id> <name> <email>");
    const id = this.parseId(args[0], "user_id");
    const email = args[args.length - 1];
    const name = args.slice(1, -1).join(" ");
    const user = this.userSvc.updateProfile(id, name, email);
    return `Profile updated. id=${user.id} name=${user.name} email=${user.email}`;
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
}
