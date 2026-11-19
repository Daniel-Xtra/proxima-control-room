import { customWindow } from "@/shared/lib/dateRange";
import { humanize } from "@/shared/lib/format";
import { request, requestFile, type Page } from "@/shared/api/client";
import { fromApiAmount, toApiAmount } from "@/shared/api/money";
import type {
  ProviderRecord,
  Transaction,
  TransactionDetail,
  TransactionFilters,
  TransactionStatus,
} from "../model/types";

interface LedgerItem {
  reference: string;
  customer_id: string | null;
  customer_name: string | null;
  direction: "credit" | "debit";
  purpose: string;
  amount: number;
  amount_unit?: string;
  status: TransactionStatus;
  balance_before: number;
  balance_after: number;
  narration: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

function toTransaction(item: LedgerItem): Transaction {
  const unit = item.amount_unit;
  return {
    reference: item.reference,
    customerId: item.customer_id,
    customerName: item.customer_name ?? "",
    direction: item.direction,
    purpose: item.purpose,
    amountKobo: fromApiAmount(item.amount, unit),
    status: item.status,
    balanceBeforeKobo: fromApiAmount(item.balance_before, unit),
    balanceAfterKobo: fromApiAmount(item.balance_after, unit),
    narration: item.narration ?? "",
    createdAt: item.created_at,
  };
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const SORT_KEYS: Record<string, "created_at" | "amount" | undefined> = {
  date: "created_at",
  amount: "amount",
};

/** The date window: a customer view may reach further back than the all-customers ledger allows. */
function windowQuery(range: string) {
  const custom = customWindow(range);
  if (custom) return custom;
  const days = RANGE_DAYS[range];
  return days ? { from: new Date(Date.now() - days * 86_400_000).toISOString() } : {};
}

function filterQuery(filters: Pick<TransactionFilters, "search" | "range" | "status" | "purpose">) {
  const search = filters.search.trim();
  return {
    search: search.length >= 3 ? search : undefined,
    status: filters.status === "all" ? undefined : filters.status,
    purpose: filters.purpose === "all" ? undefined : filters.purpose,
    ...windowQuery(filters.range),
  };
}

export async function listTransactions(filters: TransactionFilters): Promise<Page<Transaction>> {
  const sort = SORT_KEYS[filters.sort];
  const result = await request<{
    data: LedgerItem[];
    total: number;
    page: number;
    limit: number;
  }>("/admin/transactions", {
    query: {
      ...filterQuery(filters),
      customer_id: filters.customerId,
      sort,
      dir: sort ? filters.dir : undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
  return {
    items: result.data.map(toTransaction),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

interface ProviderRow {
  kind: "bank_transfer" | "bill_payment";
  processor: string | null;
  status: string;
  message?: string | null;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  external_reference?: string | null;
  session_id?: string | null;
  bill_type?: string;
  customer?: string;
  metadata: Record<string, unknown> | null;
  raw_response?: unknown;
}

function toProvider(row: ProviderRow): ProviderRecord {
  const details: Record<string, string> = {};
  const add = (key: string, value: string | null | undefined) => {
    if (value) details[key] = value;
  };
  add("bank", row.bank_name);
  add("accountName", row.account_name);
  add("accountNumber", row.account_number);
  add("externalReference", row.external_reference);
  add("sessionId", row.session_id);
  add("billType", humanize(row.bill_type));
  add("billCustomer", row.customer);
  return {
    kind: row.kind,
    processor: humanize(row.processor),
    status: row.status,
    message: row.message ?? null,
    details,
    metadata: row.metadata,
    rawResponse: row.raw_response,
  };
}

export async function getTransactionDetail(reference: string): Promise<TransactionDetail> {
  const data = await request<{
    reference: string;
    amount_unit?: string;
    entries: LedgerItem[];
    provider: ProviderRow | null;
    raw_response_visible: boolean;
  }>(`/admin/transactions/${encodeURIComponent(reference)}`);
  return {
    reference: data.reference,
    unit: data.amount_unit,
    entries: data.entries.map((entry) => ({
      ...toTransaction({ ...entry, amount_unit: entry.amount_unit ?? data.amount_unit }),
      metadata: entry.metadata ?? null,
    })),
    provider: data.provider ? toProvider(data.provider) : null,
    rawVisible: data.raw_response_visible,
  };
}

/** Asks the provider for the final status. It does not change anything if the transaction is already final. */
export async function requeryTransaction(kind: string, reference: string) {
  return request<{ skipped_terminal?: boolean }>(
    `/admin/transactions/${encodeURIComponent(kind)}/${encodeURIComponent(reference)}/requery`,
    { method: "POST" },
  );
}

const idempotency = () => ({ "Idempotency-Key": crypto.randomUUID() });

/** For a transaction that failed after the customer was debited. Another admin approves it. */
export function requestReversal(reference: string, reason: string) {
  return request(`/admin/transactions/${encodeURIComponent(reference)}/reversal-requests`, {
    method: "POST",
    headers: idempotency(),
    body: { reason },
  });
}

/** For a successful transaction. The amount goes back in the unit the ledger reports. */
export function requestRefund(
  reference: string,
  amountKobo: number,
  unit: string | undefined,
  reason: string,
) {
  return request(`/admin/transactions/${encodeURIComponent(reference)}/refund-requests`, {
    method: "POST",
    headers: idempotency(),
    body: { amount: toApiAmount(amountKobo, unit), reason },
  });
}

export function requestStatement(input: {
  customerId: string;
  format: "csv" | "pdf";
  recipient: "customer" | "third_party";
  email?: string;
  from: string;
  to: string;
  reason: string;
}) {
  const { customerId, ...body } = input;
  return request(`/admin/customers/${encodeURIComponent(customerId)}/statements`, {
    method: "POST",
    body,
  });
}

/** Downloads a CSV of the filtered ledger. */
export function exportTransactions(
  filters: Pick<TransactionFilters, "search" | "range" | "status" | "purpose" | "customerId">,
  reason: string,
) {
  return requestFile("/admin/transactions/export", {
    method: "POST",
    body: { ...filterQuery(filters), customer_id: filters.customerId, reason },
  });
}
