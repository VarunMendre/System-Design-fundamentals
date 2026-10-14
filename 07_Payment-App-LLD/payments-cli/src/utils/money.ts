import { AppError } from "../errors/AppError";

export function assertValidAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError("Amount must be a positive whole number of paise.");
  }
}

export const rupeesToPaise = (rupees: number): number =>
  Math.round(rupees * 100);

export const formatRupees = (paise: number): string =>
  `₹${(paise / 100).toFixed(2)}`;
