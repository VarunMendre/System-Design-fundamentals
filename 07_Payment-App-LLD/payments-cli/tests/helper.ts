import { CommandParser } from "../src/cli/CommandParser";
import { UserService } from "../src/services/UserService";
import { TransactionService } from "../src/services/TransactionService";
import { PaymentService } from "../src/services/PaymentService";
import { InMemoryUserRepository } from "../src/repositories/InMemoryUserRepository";
import { InMemoryBankAccountRepository } from "../src/repositories/InMemoryBankAccountRepository";
import { InMemoryTransactionRepository } from "../src/repositories/InMemoryTransactionRepository";
import { InMemoryPaymentRepository } from "../src/repositories/InMemoryPaymentRepository";
import { ScryptPasswordHasher } from "../src/utils/PasswordHasher";

export function buildApp() {
  const users = new InMemoryUserRepository();
  const txns = new InMemoryTransactionRepository();
  const payments = new InMemoryPaymentRepository();
  const userSvc = new UserService(users, new ScryptPasswordHasher());
  const txnSvc = new TransactionService(
    users,
    new InMemoryBankAccountRepository(),
    txns,
  );
  const paymentSvc = new PaymentService(txns, payments, users);
  const cli = new CommandParser(userSvc, txnSvc, paymentSvc);
  return { users, txns, payments, userSvc, txnSvc, paymentSvc, cli };
}
