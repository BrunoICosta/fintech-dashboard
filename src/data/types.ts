export const PAYMENT_METHODS = ['card_credit', 'card_debit', 'bank_transfer', 'wallet'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  card_credit: 'Credit card',
  card_debit: 'Debit card',
  bank_transfer: 'Bank transfer',
  wallet: 'Digital wallet',
};

export const TRANSACTION_STATUSES = ['approved', 'pending', 'declined', 'refunded'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  declined: 'Declined',
  refunded: 'Refunded',
};

export interface Transaction {
  id: string;
  /** Epoch milliseconds (UTC). */
  timestamp: number;
  /** UTC calendar day, `YYYY-MM-DD`. Used for daily bucketing and range filters. */
  day: string;
  /** Amounts are stored as integer cents to avoid floating-point rounding errors. */
  amountCents: number;
  customer: string;
  method: PaymentMethod;
  status: TransactionStatus;
}

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
