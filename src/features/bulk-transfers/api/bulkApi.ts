import { ApiError, request, type Page } from "@/shared/api/client";
import type { TemplatePayee } from "../model/payeeRows";
import type {
  BatchFilters,
  BatchRow,
  BatchStatus,
  BulkBatch,
  BulkItem,
  ItemStatus,
  PayeeCheck,
  PayeeDraft,
  PlatformWallet,
  SourceAccount,
  SourceBalances,
  VerifyIssue,
} from "../model/types";

/** Bulk transfers are the one place the API really does work in naira (payees are entered in naira). */
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

const ITEM_STATES: ItemStatus[] = ["pending", "processing", "success", "failed", "unknown"];

function toBatch(view: BatchView, itemCounts: Record<string, number> = {}): BulkBatch {
  return {
    itemCount: view.item_count,
    totalKobo: nairaToKobo(view.total_amount),
    counts: Object.fromEntries(
      ITEM_STATES.map((state) => [state, itemCounts[state] ?? 0]),
    ) as Record<ItemStatus, number>,
    feeKobo: nairaToKobo(view.fee_amount),
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
  const page = await request<{ data: BatchView[] }>("/admin/bulk-transfers", {
    query: { status: filters.status === "all" ? undefined : filters.status, limit: 100 },
  });
  const needle = filters.search.trim().toLowerCase();
  return page.data
    .map((view) => toBatch(view))
    .filter(
      (batch) => !needle || `${batch.name} ${batch.createdBy}`.toLowerCase().includes(needle),
    );
}

/** The batch itself. Its payees are read a page at a time with getBatchItems. */
export async function getBatch(id: string): Promise<BulkBatch> {
  const view = await request<BatchDetail>(`/admin/bulk-transfers/${encodeURIComponent(id)}`, {
    query: { limit: 1 },
  });
  return toBatch(view, view.item_counts);
}

export interface ItemFilters {
  page: number;
  limit: number;
  status: ItemStatus | "all";
}

export async function getBatchItems(id: string, filters: ItemFilters): Promise<Page<BulkItem>> {
  const view = await request<{
    items: { data: ItemView[]; total: number; page: number; limit: number };
  }>(`/admin/bulk-transfers/${encodeURIComponent(id)}`, {
    query: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status === "all" ? undefined : filters.status,
    },
  });
  return {
    items: view.items.data.map((item) => ({
      id: item.id,
      row: item.position,
      accountName: item.payee_name,
      accountNumber: item.account_number,
      bank: item.bank_name ?? item.bank_code,
      amountKobo: nairaToKobo(item.amount),
      narration: "",
      status: item.status,
      ...(item.error ? { failureReason: item.error } : {}),
    })),
    total: view.items.total,
    page: view.items.page,
    limit: view.items.limit,
  };
}

export async function decideBatch(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<BulkBatch> {
  const path = input.decision === "approved" ? "approve" : "reject";
  await request(`/admin/bulk-transfers/${encodeURIComponent(input.id)}/${path}`, {
    method: "POST",
    // Approving takes no body; rejecting needs a reason.
    ...(input.decision === "rejected" ? { body: { reason: input.comment } } : {}),
  });
  return getBatch(input.id);
}

export async function retryFailed(id: string, reason: string): Promise<BulkBatch> {
  await request(`/admin/bulk-transfers/${encodeURIComponent(id)}/retry-failed`, {
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
  const result = await request<{ data: SourceRow[] }>("/admin/bulk-transfers/source-balances");
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
  const result = await request<{ data: Bank[] }>("/admin/bulk-transfers/banks");
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
    ...new Set(
      input.payees
        .filter((p) => p.bank.trim() !== "" && !findBank(banks, p.bank))
        .map((p) => p.bank),
    ),
  ];
  if (unknown.length > 0) {
    throw new ApiError(422, `Unknown bank: ${unknown.join(", ")}. Use the bank's name or code.`);
  }
  const created = await request<{ id: string }>("/admin/bulk-transfers", {
    method: "POST",
    body: {
      name: input.name,
      source_account: input.sourceAccount,
      payees: input.payees.map((payee) => ({
        name: payee.accountName,
        // Left out when blank: the server fills it in for a platform customer and refuses it for anyone else.
        ...(payee.bank.trim() !== "" ? { bank: findBank(banks, payee.bank)?.code } : {}),
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

/** What the fee settings charge for payees receiving these amounts (kobo), summed over the batch. */
export async function estimateBulkFee(amountsKobo: number[]): Promise<number> {
  const result = await request<{ fee_amount: number }>("/admin/bulk-transfers/fee-estimate", {
    method: "POST",
    body: { amounts: amountsKobo.map((kobo) => kobo / 100) },
  });
  return nairaToKobo(result.fee_amount);
}

export async function listPlatformWallets(): Promise<PlatformWallet[]> {
  const result = await request<{
    data: { id: string; name: string; balance: number; is_enabled: boolean }[];
  }>("/admin/platform-wallets");
  return result.data.map((row) => ({
    id: row.id,
    name: row.name,
    balanceKobo: nairaToKobo(row.balance),
    enabled: row.is_enabled,
  }));
}

/** Raises a top-up request. Another admin approves it from the requests page. */
export async function requestWalletTopUp(id: string, amountNaira: number, reason: string) {
  await request(`/admin/platform-wallets/${encodeURIComponent(id)}/top-up-requests`, {
    method: "POST",
    body: { amount: amountNaira, reason },
  });
}

interface VerifyRow {
  status: PayeeCheck["status"];
  issues: VerifyIssue[];
  account_name: string | null;
  account_type: "platform" | "collection" | "external" | null;
}

/**
 * Checks rows against the database and, for other banks, the provider's name enquiry, before the batch is created.
 * Returns each row's result by its row number. A bank the list does not know is reported without asking the server.
 */
export async function verifyPayees(payees: PayeeDraft[]): Promise<Map<number, PayeeCheck>> {
  const banks = await listBanks();
  const checks = new Map<number, PayeeCheck>();
  const sendable: { draft: PayeeDraft; code: string | undefined }[] = [];
  for (const draft of payees) {
    if (draft.errors.length > 0) continue;
    // A blank bank is sent as it is: the server finds out whether the account is a platform customer.
    if (draft.bank.trim() === "") {
      sendable.push({ draft, code: undefined });
      continue;
    }
    const bank = findBank(banks, draft.bank);
    if (bank) sendable.push({ draft, code: bank.code });
    else checks.set(draft.row, { status: "invalid", issues: ["unknown_bank"] });
  }
  if (sendable.length > 0) {
    const result = await request<{ data: VerifyRow[] }>("/admin/bulk-transfers/verify", {
      method: "POST",
      body: {
        payees: sendable.map(({ draft, code }) => ({
          ...(code ? { bank: code } : {}),
          account_number: draft.accountNumber,
          ...(draft.accountName ? { name: draft.accountName } : {}),
        })),
      },
    });
    result.data.forEach((row, index) => {
      const draft = sendable[index]?.draft;
      if (!draft) return;
      checks.set(draft.row, {
        status: row.status,
        issues: row.issues,
        ...(row.account_name ? { accountName: row.account_name } : {}),
        ...(row.account_type ? { accountType: row.account_type } : {}),
      });
    });
  }
  return checks;
}

/** Real platform customers for the template's internal rows. Empty when there are none or they cannot be read. */
export async function listTemplatePayees(): Promise<TemplatePayee[]> {
  const result = await request<{
    data: { name: string; account_number: string; bank_name: string }[];
  }>("/admin/bulk-transfers/template-payees", { query: { limit: 25 } });
  return result.data.map((row) => ({
    name: row.name,
    accountNumber: row.account_number,
    bank: row.bank_name,
  }));
}
