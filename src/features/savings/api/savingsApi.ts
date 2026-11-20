import { request, type Page } from "@/shared/api/client";
import { fromApiAmount } from "@/shared/api/money";
import { unavailable } from "@/shared/api/unavailable";
import type {
  BreakagePreview,
  FixedDeposit,
  PlanInterest,
  PlanTransaction,
  SavingsKind,
  FixedDepositStatus,
  Frequency,
  TargetSaving,
  TargetSavingStatus,
} from "../model/types";

interface FixedRow {
  id: string;
  name?: string | null;
  reference?: string | null;
  customer_id: string | null;
  customer_name: string | null;
  principal: number;
  rate_percent: number;
  duration: number | string;
  status: FixedDepositStatus;
  locked: boolean;
  start_date: string;
  maturity_date: string;
  amount_unit?: string;
}

interface TargetRow {
  id: string;
  reference?: string | null;
  customer_id: string | null;
  customer_name: string | null;
  name: string;
  target: number;
  saved: number;
  frequency: Frequency;
  status: TargetSavingStatus;
  start_date: string;
  amount_unit?: string;
}

export interface SavingsFilters {
  /** Matches the plan or customer name; the API needs 3 or more characters. */
  search: string;
  /** "all", "active", "matured", "paid" or "cancelled". */
  status: string;
}

const NO_FILTERS: SavingsFilters = { search: "", status: "all" };

const query = (
  customerId: string | undefined,
  filters: SavingsFilters,
  page: number,
  limit: number,
) => ({
  customer_id: customerId,
  page,
  search: filters.search.trim().length >= 3 ? filters.search.trim() : undefined,
  status: filters.status === "all" ? undefined : filters.status,
  limit,
});

export async function listFixedDeposits(
  customerId?: string,
  filters: SavingsFilters = NO_FILTERS,
  page = 1,
  limit = 10,
): Promise<Page<FixedDeposit>> {
  const result = await request<{ data: FixedRow[]; total?: number }>(
    "/admin/savings/fixed-deposits",
    { query: query(customerId, filters, page, limit) },
  );
  const items = result.data.map((row) => ({
    id: row.id,
    name: row.name ?? "",
    reference: row.reference ?? "",
    customerId: row.customer_id ?? "",
    customerName: row.customer_name ?? "",
    principalKobo: fromApiAmount(row.principal, row.amount_unit),
    interestRatePercent: row.rate_percent,
    // The API gives the duration as a plain number; it is read as days.
    durationDays: Number.parseInt(String(row.duration), 10) || 0,
    startedAt: row.start_date,
    maturesAt: row.maturity_date,
    locked: row.locked,
    status: row.status,
  }));
  return { items, total: result.total ?? items.length, page, limit };
}

export async function listTargetSavings(
  customerId?: string,
  filters: SavingsFilters = NO_FILTERS,
  page = 1,
  limit = 10,
): Promise<Page<TargetSaving>> {
  const result = await request<{ data: TargetRow[]; total?: number }>(
    "/admin/savings/target-savings",
    { query: query(customerId, filters, page, limit) },
  );
  const items = result.data.map((row) => ({
    id: row.id,
    reference: row.reference ?? "",
    customerId: row.customer_id ?? "",
    customerName: row.customer_name ?? "",
    name: row.name,
    targetKobo: fromApiAmount(row.target, row.amount_unit),
    savedKobo: fromApiAmount(row.saved, row.amount_unit),
    frequency: row.frequency,
    startedAt: row.start_date,
    status: row.status,
  }));
  return { items, total: result.total ?? items.length, page, limit };
}

export async function previewBreakage(id: string): Promise<BreakagePreview> {
  const row = await request<{
    principal: number;
    accrued_interest: number;
    breakage_fee: number;
    payout: number;
    amount_unit?: string;
  }>(`/admin/savings/fixed-deposits/${encodeURIComponent(id)}/breakage-preview`);
  return {
    principalKobo: fromApiAmount(row.principal, row.amount_unit),
    accruedInterestKobo: fromApiAmount(row.accrued_interest, row.amount_unit),
    breakageFeeKobo: fromApiAmount(row.breakage_fee, row.amount_unit),
    payoutKobo: fromApiAmount(row.payout, row.amount_unit),
  };
}

/** The admin API only reads savings: liquidating one is not offered yet. */
export function liquidateFixedDeposit(_id: string, _reason: string): Promise<void> {
  return unavailable();
}

export function liquidateTargetSaving(_id: string, _reason: string): Promise<void> {
  return unavailable();
}

const PLAN_PATH = { fixed: "fixed-deposits", target: "target-savings" } as const;

/** Money in and out of one plan, newest first. */
export async function listPlanTransactions(
  kind: SavingsKind,
  id: string,
  page: number,
  limit: number,
): Promise<Page<PlanTransaction>> {
  const result = await request<{
    data: {
      reference: string;
      type: "inflow" | "outflow";
      purpose: string;
      channel: string;
      amount: number;
      description: string;
      created_at: string;
      amount_unit?: string;
    }[];
    total?: number;
  }>(`/admin/savings/${PLAN_PATH[kind]}/${encodeURIComponent(id)}/transactions`, {
    query: { page, limit },
  });
  const items = result.data.map((row) => ({
    reference: row.reference,
    direction: row.type,
    purpose: row.purpose,
    channel: row.channel,
    amountKobo: fromApiAmount(row.amount, row.amount_unit),
    description: row.description,
    at: row.created_at,
  }));
  return { items, total: result.total ?? items.length, page, limit };
}

/** The recurring interest added to one plan, newest first. */
export async function listPlanInterest(
  kind: SavingsKind,
  id: string,
  page: number,
  limit: number,
): Promise<Page<PlanInterest>> {
  const result = await request<{
    data: {
      interest_date: string;
      amount: number;
      processed_at: string | null;
      amount_unit?: string;
    }[];
    total?: number;
  }>(`/admin/savings/${PLAN_PATH[kind]}/${encodeURIComponent(id)}/interest`, {
    query: { page, limit },
  });
  const items = result.data.map((row) => ({
    date: row.interest_date,
    amountKobo: fromApiAmount(row.amount, row.amount_unit),
    creditedAt: row.processed_at,
  }));
  return { items, total: result.total ?? items.length, page, limit };
}
