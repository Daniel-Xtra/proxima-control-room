import type { MessageKey } from "@/shared/i18n/t";

/** A payout source reported by the API (an id such as the settlement account). */
export type SourceAccount = string;
/** What the form knows about the selected account's balance. */
export interface BalanceInfo {
  status: "pending" | "error" | "success";
  kobo?: number;
}

/** Available balance of each payout account, in kobo. */
/** A payout source from the API with its live balance. `balanceKobo` is null when it could not be read. */
export type SourceBalances = {
  id: SourceAccount;
  name: string;
  balanceKobo: number | null;
  error: string | null;
}[];

/** Largest amount one payee may receive in a batch (₦10,000,000), in kobo. */
export const MAX_PAYEE_KOBO = 1_000_000_000;
/** Batches above this total ask for a typed confirmation (₦10,000,000), in kobo. */
export const LARGE_BATCH_KOBO = 1_000_000_000;

export { MAX_SCHEDULE_DAYS } from "@/shared/lib/schedule";

export type BatchStatus =
  | "pending_funding"
  | "pending_approval"
  | "approved"
  | "processing"
  | "reconciling"
  | "completed"
  | "partially_failed"
  | "failed"
  | "rejected"
  | "cancelled";
export type ItemStatus = "success" | "failed" | "pending" | "processing" | "unknown";

export interface BulkItem {
  id: string;
  row: number;
  accountName: string;
  accountNumber: string;
  bank: string;
  amountKobo: number;
  narration: string;
  status: ItemStatus;
  failureReason?: string;
}

export interface BulkBatch {
  id: string;
  name: string;
  /** Empty for people who may not see it: the uploader never learns which account pays. */
  sourceAccount: SourceAccount | null;
  createdBy: string;
  /** Who chose the pay-from account and passed the batch on. */
  fundedBy?: string;
  fundedAt?: string;
  createdAt: string;
  reason: string;
  /** ISO time the payments should run. Empty means right after approval. */
  scheduledFor?: string;
  status: BatchStatus;
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
  /** What the backend priced the batch at, from the fee settings. */
  feeKobo: number;
  itemCount: number;
  totalKobo: number;
  /** How many payees are in each state, counted over the whole batch. */
  counts: Record<ItemStatus, number>;
}

export type BatchRow = BulkBatch;

export type VerifyIssue =
  | "unknown_bank"
  | "bank_required"
  | "duplicate"
  | "account_not_found"
  | "collection_account"
  | "recipient_disabled"
  | "name_mismatch"
  | "name_partial"
  | "lookup_failed";

/** What checking a row against the database and the provider found. Rows that cannot be paid are "invalid". */
export interface PayeeCheck {
  status: "verified" | "warning" | "invalid";
  issues: VerifyIssue[];
  /** The name the account really has, when it was found. */
  accountName?: string;
  accountType?: "platform" | "collection" | "external";
}

/** A payee row from the uploaded Excel file, before it is submitted. */
export interface PayeeDraft {
  row: number;
  accountName: string;
  accountNumber: string;
  bank: string;
  /** `null` when the amount could not be read. */
  amountKobo: number | null;
  narration: string;
  errors: MessageKey[];
  /** Set once the row has been verified. */
  check?: PayeeCheck;
}

export interface BatchFilters {
  search: string;
  status: string;
  page: number;
  limit: number;
}

/** A platform wallet bulk transfers can pay from. */
export interface PlatformWallet {
  id: string;
  name: string;
  balanceKobo: number;
  enabled: boolean;
}
