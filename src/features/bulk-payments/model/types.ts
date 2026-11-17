import type { MessageKey } from "@/shared/i18n/t";

export const BANKS = [
  "Access Bank",
  "GTBank",
  "First Bank",
  "UBA",
  "Zenith Bank",
  "Kuda",
  "Opay",
  "Moniepoint",
  "Wema Bank",
  "Sterling Bank",
] as const;

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

/** Fee charged per payee, in kobo. */
export const FEE_PER_PAYEE_KOBO = 5_000;
/** Largest amount one payee may receive in a batch (₦10,000,000), in kobo. */
export const MAX_PAYEE_KOBO = 1_000_000_000;
/** Batches above this total ask for a typed confirmation (₦10,000,000), in kobo. */
export const LARGE_BATCH_KOBO = 1_000_000_000;

export { MAX_SCHEDULE_DAYS } from "@/shared/lib/schedule";

export type BatchStatus =
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
  sourceAccount: SourceAccount;
  createdBy: string;
  createdAt: string;
  reason: string;
  /** ISO time the payments should run. Empty means right after approval. */
  scheduledFor?: string;
  status: BatchStatus;
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
  items: BulkItem[];
}

export interface BatchSummary {
  itemCount: number;
  totalKobo: number;
  feeKobo: number;
  successCount: number;
  failedCount: number;
}

export type BatchRow = Omit<BulkBatch, "items"> & BatchSummary;

export function summarize(items: BulkItem[]): BatchSummary {
  const totalKobo = items.reduce((sum, item) => sum + item.amountKobo, 0);
  return {
    itemCount: items.length,
    totalKobo,
    feeKobo: items.length * FEE_PER_PAYEE_KOBO,
    successCount: items.filter((item) => item.status === "success").length,
    failedCount: items.filter((item) => item.status === "failed").length,
  };
}

/** A payee row from the CSV or the paste box, before it is submitted. */
export interface PayeeDraft {
  row: number;
  accountName: string;
  accountNumber: string;
  bank: string;
  /** `null` when the amount could not be read. */
  amountKobo: number | null;
  narration: string;
  errors: MessageKey[];
}

export interface BatchFilters {
  search: string;
  status: string;
}
