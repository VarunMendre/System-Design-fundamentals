import { BankAccount } from "../domain/BankAccount";

export interface BankAccountRepository {
  save(account: BankAccount): BankAccount;
  findByAccountNumberAndIfsc(
    accountNumber: string,
    ifsc: string,
  ): BankAccount | undefined;
}


