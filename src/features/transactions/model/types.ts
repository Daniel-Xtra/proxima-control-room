export type TransactionStatus = "pending" | "failed" | "success";
export type TransactionDirection = "credit" | "debit";
export const TRANSACTION_PURPOSES = [
  "wallet_transfer",
  "bank_transfer",
  "bill_payment",
  "airtime_payment",
  "data_payment",
  "reserved_account_funding",
  "reversal",
  "fixed_deposit",
  "target_savings",
] as const;
export type TransactionPurpose = (typeof TRANSACTION_PURPOSES)[number];

export interface Transaction {
  reference: string;
  customerId: string;
  customerName: string;
  direction: TransactionDirection;
  purpose: TransactionPurpose;
  amountKobo: number;
  status: TransactionStatus;
  balanceBeforeKobo: number;
  balanceAfterKobo: number;
  narration: string;
  metadata: Record<string, string | number>;
  providerResponse: string;
  createdAt: string;
}

export interface TransactionFilters {
  search: string;
  range: string;
  status: string;
  purpose: string;
  sort: string;
  dir: string;
  customerId?: string;
  page: number;
  limit: number;
}
