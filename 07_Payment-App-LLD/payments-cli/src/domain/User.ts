import { AppError } from "../errors/AppError";
import { assertValidAmount } from "../utils/money";

export class User {
  id = 0;
  name?: string;
  email?: string;
  readonly createdAt = new Date();

  constructor(
    public readonly phone: string,
    public passwordHash: string,
    public balance: number,
  ) {}

  hasFunds(amount: number): boolean {
    return this.balance >= amount;
  }

  credit(amount: number): void {
    assertValidAmount(amount);
    this.balance += amount;
    }
    
    debit(amount: number): void {
        assertValidAmount(amount);
        if (!this.hasFunds(amount))
            throw new AppError("Insufficient balance");

        this.balance -= amount;
    }
}


