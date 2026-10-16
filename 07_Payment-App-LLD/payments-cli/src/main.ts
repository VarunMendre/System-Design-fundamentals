import * as readline from "node:readline";
import { CommandParser } from "./cli/CommandParser";
import { UserService } from "./services/UserService";
import { TransactionService } from "./services/TransactionService";
import { InMemoryUserRepository } from "./repositories/InMemoryUserRepository";
import { InMemoryBankAccountRepository } from "./repositories/InMemoryBankAccountRepository";
import { InMemoryTransactionRepository } from "./repositories/InMemoryTransactionRepository";
import { ScryptPasswordHasher } from "./utils/PasswordHasher";

// Composition root
const userRepo = new InMemoryUserRepository();
const bankRepo = new InMemoryBankAccountRepository();
const txnRepo = new InMemoryTransactionRepository();

const userSvc = new UserService(userRepo, new ScryptPasswordHasher());
const txnSvc = new TransactionService(userRepo, bankRepo, txnRepo);
const parser = new CommandParser(userSvc, txnSvc);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});
rl.prompt();

rl.on("line", (line) => {
  if (["exit", "quit"].includes(line.trim().toLowerCase())) {
    rl.close();
    return;
  }
  const out = parser.execute(line);
  if (out) console.log(out);
  rl.prompt();
});
