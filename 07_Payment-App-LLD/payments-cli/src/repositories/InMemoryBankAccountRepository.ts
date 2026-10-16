import { BankAccount } from "../domain/BankAccount";
import { BankAccountRepository } from "./BankAccountRepository";

export class InMemoryBankAccountRepository implements BankAccountRepository {
  private accounts = new Map<string, BankAccount>();
  private nextId = 1;

  save(account: BankAccount): BankAccount {
    if (account.id === 0) account.id = this.nextId++;

    this.accounts.set(this.key(account.accountNumber, account.ifsc), account);
    return account;
  }

  findByAccountNumberAndIfsc(
    amountNumber: string,
    ifsc: string,
  ): BankAccount | undefined {
    return this.accounts.get(this.key(amountNumber, ifsc));
  }

  private key(accountNumber: string, ifsc: string): string {
    return `${accountNumber}|${ifsc}`;
  }
}


