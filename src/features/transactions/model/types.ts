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
  "fixed_deposit*",
  "target_saving*",
] as const;
export type KnownPurpose = (typeof TRANSACTION_PURPOSES)[number];

export interface Transaction {
  reference: string;
  customerId: string | null;
  customerName: string;
  direction: TransactionDirection;
  /** The ledger can hold purposes the UI has no label for, so this is any string. */
  purpose: string;
  amountKobo: number;
  status: TransactionStatus;
  balanceBeforeKobo: number;
  balanceAfterKobo: number;
  narration: string;
  createdAt: string;
}

export type ProviderKind = "bank_transfer" | "bill_payment";

export interface ProviderRecord {
  kind: ProviderKind;
  processor: string | null;
  status: string;
  message: string | null;
  /** Bank, account and session for transfers; bill type and customer for bills. */
  details: Record<string, string>;
  metadata: Record<string, unknown> | null;
  /** Only present when the viewer may see raw provider payloads. */
  rawResponse: unknown;
}

export interface TransactionDetail {
  reference: string;
  /** The unit the API reports amounts in: refund amounts are sent back in it. */
  unit: string | undefined;
  entries: (Transaction & { metadata: Record<string, unknown> | null })[];
  provider: ProviderRecord | null;
  rawVisible: boolean;
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
