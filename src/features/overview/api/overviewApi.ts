import { request } from "@/shared/api/client";
import { fromApiAmount } from "@/shared/api/money";
import { parseCustomRange } from "@/shared/lib/dateRange";
import { dayLabel } from "@/shared/lib/dayLabel";
import { purposeLabel } from "@/shared/lib/purposeLabel";

/**
 * The overview is read a section at a time. Each section has its own endpoint, and the ones with a period take their own,
 * so changing the period of one never reloads another.
 */

export interface Bucket {
  count: number;
  amountKobo: number;
}

export interface BillBucket extends Bucket {
  successes: number;
  failures: number;
  pending: number;
}

/** A custom range is sent as its first and last day; the server compares it with the period just before. */
function periodQuery(range: string) {
  const custom = parseCustomRange(range);
  return custom ? { from: custom.from, to: custom.to } : { range };
}

/** No period to compare with means no change to report. */
const delta = (pct: number | null) => pct ?? 0;

// ---- cards -------------------------------------------------------------------------------------------------------

export interface OverviewSummary {
  /** Percent change against the previous period of the same length. */
  deltas: { transactions: number; value: number; fixedDeposits: number; targetSavings: number };
  transactions: { total: number; valueKobo: number };
  fixedDeposits: { total: number };
  targetSavings: { total: number };
  transfers: { total: number; successful: number; failed: number; pending: number };
  bills: { total: number; airtime: number; data: number; failures: number };
  signUps: { total: number; male: number; female: number };
}

interface SummaryResponse {
  amount_unit?: string;
  transactions: {
    volume: number;
    value: number;
    volume_delta_pct: number | null;
    value_delta_pct: number | null;
  };
  fixed_deposits: { volume: number; volume_delta_pct: number | null };
  target_savings: { volume: number; volume_delta_pct: number | null };
  transfers: { total: number; successful: number; failed: number; pending: number };
  bills: { total: number; airtime: { count: number }; data: { count: number }; failures: number };
  signups: { total: number; gender: { male: number; female: number } };
}

export async function getOverviewSummary(range: string): Promise<OverviewSummary> {
  const r = await request<SummaryResponse>("/admin/overview/summary", {
    query: periodQuery(range),
  });
  return {
    deltas: {
      transactions: delta(r.transactions.volume_delta_pct),
      value: delta(r.transactions.value_delta_pct),
      fixedDeposits: delta(r.fixed_deposits.volume_delta_pct),
      targetSavings: delta(r.target_savings.volume_delta_pct),
    },
    transactions: {
      total: r.transactions.volume,
      valueKobo: fromApiAmount(r.transactions.value, r.amount_unit),
    },
    fixedDeposits: { total: r.fixed_deposits.volume },
    targetSavings: { total: r.target_savings.volume },
    transfers: r.transfers,
    bills: {
      total: r.bills.total,
      airtime: r.bills.airtime.count,
      data: r.bills.data.count,
      failures: r.bills.failures,
    },
    signUps: {
      total: r.signups.total,
      male: r.signups.gender.male,
      female: r.signups.gender.female,
    },
  };
}

// ---- trend -------------------------------------------------------------------------------------------------------

export interface OverviewTrend {
  labels: string[];
  valueKobo: number[];
  volume: number[];
}

interface TrendResponse {
  amount_unit?: string;
  trend: { date: string; volume: number; value: number }[];
}

/** The daily line for a period, for all transactions or one purpose such as `bank_transfer`. */
export async function getOverviewTrend(range: string, purpose?: string): Promise<OverviewTrend> {
  const r = await request<TrendResponse>("/admin/overview/trend", {
    query: { ...periodQuery(range), purpose },
  });
  return {
    labels: r.trend.map((point) => dayLabel(point.date)),
    valueKobo: r.trend.map((point) => fromApiAmount(point.value, r.amount_unit)),
    volume: r.trend.map((point) => point.volume),
  };
}

// ---- status ------------------------------------------------------------------------------------------------------

export interface OverviewStatus {
  transfers: { total: Bucket; successful: Bucket; failed: Bucket; pending: Bucket };
  bills: {
    airtime: BillBucket;
    data: BillBucket;
    billers: { name: string; count: number; amountKobo: number; failures: number }[];
  };
}

interface BillType {
  type: string;
  count: number;
  amount: number;
  failures: number;
}

interface StatusResponse {
  amount_unit?: string;
  transfers: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    value: number;
  };
  bills: { airtime: BillType; data: BillType; billers: BillType[] };
}

/** How transfers and bill payments ended in a period. */
export async function getOverviewStatus(range: string): Promise<OverviewStatus> {
  const r = await request<StatusResponse>("/admin/overview/status", {
    query: periodQuery(range),
  });
  const money = (amount: number) => fromApiAmount(amount, r.amount_unit);
  // The API gives counts for transfers, and money only for the successful ones.
  const count = (n: number, amountKobo = 0): Bucket => ({ count: n, amountKobo });
  const bill = (b: BillType): BillBucket => ({
    count: b.count,
    amountKobo: money(b.amount),
    successes: Math.max(0, b.count - b.failures),
    failures: b.failures,
    pending: 0,
  });
  return {
    transfers: {
      total: count(r.transfers.total, money(r.transfers.value)),
      successful: count(r.transfers.successful, money(r.transfers.value)),
      failed: count(r.transfers.failed),
      pending: count(r.transfers.pending),
    },
    bills: {
      airtime: bill(r.bills.airtime),
      data: bill(r.bills.data),
      billers: r.bills.billers.map((biller) => ({
        name: purposeLabel(biller.type),
        count: biller.count,
        amountKobo: money(biller.amount),
        failures: biller.failures,
      })),
    },
  };
}

// ---- savings -----------------------------------------------------------------------------------------------------

export interface OverviewSavings {
  fixedTotalKobo: number;
  fixedCount: number;
  targetTotalKobo: number;
  targetCount: number;
}

interface SavingsResponse {
  amount_unit?: string;
  savings: {
    fixed_deposit_principal: number;
    fixed_deposit_interest: number;
    target_savings_balance: number;
  };
  fixed_deposits: { active: { count: number } };
  target_savings: { active: { count: number } };
}

/** What customers hold now. It has no period. */
export async function getOverviewSavings(): Promise<OverviewSavings> {
  const r = await request<SavingsResponse>("/admin/overview/savings");
  const money = (amount: number) => fromApiAmount(amount, r.amount_unit);
  return {
    fixedTotalKobo: money(r.savings.fixed_deposit_principal + r.savings.fixed_deposit_interest),
    fixedCount: r.fixed_deposits.active.count,
    targetTotalKobo: money(r.savings.target_savings_balance),
    targetCount: r.target_savings.active.count,
  };
}
