import { ApiError, request } from "@/shared/api/client";
import type {
  BatchFilters,
  BatchRow,
  BatchStatus,
  BulkBatch,
  BulkItem,
  ItemStatus,
  PayeeDraft,
  SourceAccount,
  SourceBalances,
} from "../model/types";

/** Bulk payments are the one place the API really does work in naira (payees are entered in naira). */
const nairaToKobo = (naira: number) => Math.round(naira * 100);

interface BatchView {
  id: string;
  name: string;
  source_account: string;
  status: BatchStatus;
  total_amount: number;
  fee_amount: number;
  amount_unit?: string;
  item_count: number;
  scheduled_for: string | null;
  created_by_name: string | null;
  decided_by_name: string | null;
  decision_reason: string | null;
  started_at: string | null;
  created_at: string;
}

interface ItemView {
  id: string;
  position: number;
  payee_name: string;
  bank_name: string | null;
  bank_code: string;
  account_number: string;
  amount: number;
  status: ItemStatus;
  error: string | null;
}

interface BatchDetail extends BatchView {
  item_counts: Record<string, number>;
  items: { data: ItemView[] };
}

function toBatch(view: BatchView): Omit<BulkBatch, "items"> {
  return {
    id: view.id,
    name: view.name,
    sourceAccount: view.source_account,
    createdBy: view.created_by_name ?? "",
    createdAt: view.created_at,
    // The API does not send the reason the batch was raised with.
    reason: "",
    ...(view.scheduled_for ? { scheduledFor: view.scheduled_for } : {}),
    status: view.status,
    ...(view.decided_by_name ? { decidedBy: view.decided_by_name } : {}),
    ...(view.started_at ? { decidedAt: view.started_at } : {}),
    ...(view.decision_reason ? { decisionComment: view.decision_reason } : {}),
  };
}

export async function listBatches(filters: BatchFilters): Promise<BatchRow[]> {
  const page = await request<{ data: BatchView[] }>("/admin/bulk-payments", {
    query: { status: filters.status === "all" ? undefined : filters.status, limit: 100 },
  });
  const needle = filters.search.trim().toLowerCase();
  return page.data
    .map((view) => ({
      ...toBatch(view),
      itemCount: view.item_count,
      totalKobo: nairaToKobo(view.total_amount),
      feeKobo: nairaToKobo(view.fee_amount),
      // The list does not count outcomes per batch; the detail page does.
      successCount: 0,
      failedCount: 0,
    }))
    .filter(
      (batch) => !needle || `${batch.name} ${batch.createdBy}`.toLowerCase().includes(needle),
    );
}

export async function getBatch(id: string): Promise<BulkBatch> {
  const view = await request<BatchDetail>(`/admin/bulk-payments/${encodeURIComponent(id)}`, {
    query: { limit: 500 },
  });
  const items: BulkItem[] = view.items.data.map((item) => ({
    id: item.id,
    row: item.position,
    accountName: item.payee_name,
    accountNumber: item.account_number,
    bank: item.bank_name ?? item.bank_code,
    amountKobo: nairaToKobo(item.amount),
    narration: "",
    status: item.status,
    ...(item.error ? { failureReason: item.error } : {}),
  }));
  return { ...toBatch(view), items };
}

export async function decideBatch(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<BulkBatch> {
  const path = input.decision === "approved" ? "approve" : "reject";
  await request(`/admin/bulk-payments/${encodeURIComponent(input.id)}/${path}`, {
    method: "POST",
    // Approving takes no body; rejecting needs a reason.
    ...(input.decision === "rejected" ? { body: { reason: input.comment } } : {}),
  });
  return getBatch(input.id);
}

export async function retryFailed(id: string, reason: string): Promise<BulkBatch> {
  await request(`/admin/bulk-payments/${encodeURIComponent(id)}/retry-failed`, {
    method: "POST",
    body: { reason },
  });
  return getBatch(id);
}

interface SourceRow {
  id: string;
  name: string;
  available_balance: number | null;
  amount_unit?: string;
  error: string | null;
}

/** Payout sources the batch can be paid from, with their live balance. */
export async function getSourceBalances(): Promise<SourceBalances> {
  const result = await request<{ data: SourceRow[] }>("/admin/bulk-payments/source-balances");
  return result.data.map((row) => ({
    id: row.id,
    name: row.name,
    balanceKobo: row.available_balance === null ? null : nairaToKobo(row.available_balance),
    error: row.error,
  }));
}

export interface Bank {
  code: string;
  name: string;
}

export async function listBanks(): Promise<Bank[]> {
  const result = await request<{ data: Bank[] }>("/admin/bulk-payments/banks");
  return result.data;
}

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Finds a bank by code, or by name ignoring case and punctuation. */
function findBank(banks: Bank[], text: string): Bank | undefined {
  const wanted = normalise(text);
  return (
    banks.find((bank) => bank.code === text.trim()) ??
    banks.find((bank) => normalise(bank.name) === wanted) ??
    banks.find((bank) => normalise(bank.name).includes(wanted) && wanted.length >= 3)
  );
}

export interface NewBatch {
  name: string;
  sourceAccount: SourceAccount;
  payees: PayeeDraft[];
  reason: string;
  /** ISO time to pay at. Leave out to pay right after approval. */
  scheduledFor?: string;
}

export async function createBatch(input: NewBatch): Promise<BulkBatch> {
  const banks = await listBanks();
  const unknown = [
    ...new Set(input.payees.filter((p) => !findBank(banks, p.bank)).map((p) => p.bank)),
  ];
  if (unknown.length > 0) {
    throw new ApiError(422, `Unknown bank: ${unknown.join(", ")}. Use the bank's name or code.`);
  }
  const created = await request<{ id: string }>("/admin/bulk-payments", {
    method: "POST",
    body: {
      name: input.name,
      source_account: input.sourceAccount,
      payees: input.payees.map((payee) => ({
        name: payee.accountName,
        bank: findBank(banks, payee.bank)?.code,
        account_number: payee.accountNumber,
        // Payee amounts go in the unit the batch lists use; the API takes naira.
        amount: (payee.amountKobo ?? 0) / 100,
        ...(payee.narration ? { narration: payee.narration } : {}),
      })),
      ...(input.scheduledFor ? { scheduled_for: input.scheduledFor } : {}),
      reason: input.reason,
    },
  });
  return getBatch(created.id);
}
