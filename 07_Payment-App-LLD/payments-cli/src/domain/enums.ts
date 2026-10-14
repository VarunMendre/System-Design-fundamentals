export enum TransactionType {
  WALLET_TO_WALLET = "WALLET_TO_WALLET",
  WALLET_TO_BANK = "WALLET_TO_BANK",
  REFUND = "REFUND",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMode {
  CARD = "CARD",
  UPI = "UPI",
  NETBANKING = "NETBANKING",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  CANCELLED = "CANCELLED",
}
