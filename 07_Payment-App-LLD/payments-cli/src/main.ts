import * as readline from "node:readline";
import { CommandParser } from "./cli/CommandParser";
import { UserService } from "./services/UserService";
import { TransactionService } from "./services/TransactionService";
import { InMemoryUserRepository } from "./repositories/InMemoryUserRepository";
import { InMemoryBankAccountRepository } from "./repositories/InMemoryBankAccountRepository";
import { InMemoryTransactionRepository } from "./repositories/InMemoryTransactionRepository";
import { ScryptPasswordHasher } from "./utils/PasswordHasher";
import { PaymentService } from "./services/PaymentService";
import { InMemoryPaymentRepository } from "./repositories/InMemoryPaymentRepository";

// Composition root
const userRepo = new InMemoryUserRepository();
const bankRepo = new InMemoryBankAccountRepository();
const txnRepo = new InMemoryTransactionRepository();
const paymentRepo = new InMemoryPaymentRepository();

const userSvc = new UserService(userRepo, new ScryptPasswordHasher());
const txnSvc = new TransactionService(userRepo, bankRepo, txnRepo);
const paymentSvc = new PaymentService(txnRepo, paymentRepo, userRepo);
const parser = new CommandParser(userSvc, txnSvc, paymentSvc);

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
