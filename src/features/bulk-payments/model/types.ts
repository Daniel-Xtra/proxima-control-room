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

export const SOURCE_ACCOUNTS = ["settlement", "float"] as const;
export type SourceAccount = (typeof SOURCE_ACCOUNTS)[number];
/** What the form knows about the selected account's balance. */
export interface BalanceInfo {
  status: "pending" | "error" | "success";
  kobo?: number;
}

/** Available balance of each payout account, in kobo. */
export type SourceBalances = Record<SourceAccount, number>;

/** Fee charged per payee, in kobo. */
export const FEE_PER_PAYEE_KOBO = 5_000;
/** Largest amount one payee may receive in a batch (₦10,000,000), in kobo. */
export const MAX_PAYEE_KOBO = 1_000_000_000;
/** Batches above this total ask for a typed confirmation (₦10,000,000), in kobo. */
export const LARGE_BATCH_KOBO = 1_000_000_000;

export { MAX_SCHEDULE_DAYS } from "@/shared/lib/schedule";

export type BatchStatus =
  "pending_approval" | "scheduled" | "completed" | "partially_failed" | "rejected";
export type ItemStatus = "success" | "failed" | "pending";

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
