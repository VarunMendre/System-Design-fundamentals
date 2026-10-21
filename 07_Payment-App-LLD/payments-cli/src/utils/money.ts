import { MAX_AMOUNT } from "../config/constants";
import { AppError } from "../errors/AppError";

export function assertValidAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError("Amount must be a positive whole number of paise.");
  }

  if (amount > MAX_AMOUNT) {
    throw new AppError(`Amount cannot exceed ${formatRupees(MAX_AMOUNT)}`);
  }
}

export const rupeesToPaise = (rupees: number): number =>
  Math.round(rupees * 100);

export const formatRupees = (paise: number): string =>
  `₹${(paise / 100).toFixed(2)}`;
