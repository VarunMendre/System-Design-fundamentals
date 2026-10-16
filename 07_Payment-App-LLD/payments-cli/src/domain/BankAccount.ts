export class BankAccount {
  id = 0;

  holderName?: string;

  constructor(
    public readonly accountNumber: string,
    public readonly ifsc: string,
  ) {}
}
