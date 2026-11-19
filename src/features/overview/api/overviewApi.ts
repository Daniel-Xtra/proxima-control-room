import { parseCustomRange } from "@/shared/lib/dateRange";
import { purposeLabel } from "@/shared/lib/purposeLabel";
import { request } from "@/shared/api/client";
import { dayLabel } from "@/shared/lib/dayLabel";
import { fromApiAmount } from "@/shared/api/money";

export interface Bucket {
  count: number;
  amountKobo: number;
}

export interface RecentTransaction {
  id: string;
  name: string;
  amountKobo: number;
  /** Any ledger purpose; label it with `purposeLabel`. */
  purpose: string;
  status: "success" | "pending" | "failed";
}

export interface Overview {
  /** Percent change against the previous period of the same length. */
  deltas: { transactions: number; value: number; fixedDeposits: number; targetSavings: number };
  valueKobo: number;
  series: {
    /** Calendar days, oldest first, one per point. */
    dates: string[];
    labels: string[];
    valueKobo: number[];
    volume: number[];
    /** The same series split by what the money was for. Empty when the server does not send it. */
    byPurpose: { purpose: string; valueKobo: number[]; volume: number[] }[];
  };
  recent: RecentTransaction[];
  kpis: {
    transactions: { total: number; trend: number[] };
    fixedDeposits: { total: number; trend: number[] };
    targetSavings: { total: number; trend: number[] };
  };
  transfers: {
    total: Bucket;
    successful: Bucket;
    failed: Bucket;
    pending: Bucket;
    wallet: Bucket;
    otherBank: Bucket;
    weekday: { label: string; count: number }[];
  };
  bills: {
    airtime: Bucket & { successes: number; failures: number; pending: number };
    data: Bucket & { successes: number; failures: number; pending: number };
    billers: { name: string; count: number; amountKobo: number; failures: number }[];
  };
  customers: {
    signUps: number;
    trend: number[];
    male: number;
    female: number;
    unspecified: number;
  };
  savings: {
    fixedTotalKobo: number;
    fixedCount: number;
    targetTotalKobo: number;
    targetCount: number;
  };
}

interface Series {
  volume: number;
  value: number;
  volume_delta_pct: number | null;
  value_delta_pct: number | null;
  trend: { date: string; volume: number; value: number }[];
}

interface BillType {
  type: string;
  count: number;
  amount: number;
  failures: number;
}

interface OverviewResponse {
  amount_unit?: string;
  transactions: Series & {
    by_purpose?: { purpose: string; volume: number; trend: Series["trend"] }[];
  };
  fixed_deposits: Series & { active: { count: number } };
  target_savings: Series & { active: { count: number } };
  transfers: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    value: number;
    wallet: number;
    other_bank: number;
    weekday: { day: string; count: number }[];
  };
  bills: { airtime: BillType; data: BillType; billers: BillType[] };
  signups: {
    total: number;
    trend: { date: string; count: number }[];
    gender: { male: number; female: number; other: number; unknown: number };
  };
  savings: {
    fixed_deposit_principal: number;
    fixed_deposit_interest: number;
    target_savings_balance: number;
  };
  recent_transactions: {
    reference: string;
    customer_name: string | null;
    amount: number;
    purpose: string;
    status: "success" | "pending" | "failed";
  }[];
}

export async function getOverview(range: string): Promise<Overview> {
  // A custom range is sent as its first and last day; the server compares it with the period just before.
  const custom = parseCustomRange(range);
  const r = await request<OverviewResponse>("/admin/overview", {
    query: custom ? { from: custom.from, to: custom.to } : { range },
  });
  const money = (amount: number) => fromApiAmount(amount, r.amount_unit);
  // No period to compare with means no change to report.
  const delta = (pct: number | null) => pct ?? 0;
  // The API gives counts for transfers and money only for the successful ones.
  const count = (n: number, amountKobo = 0): Bucket => ({ count: n, amountKobo });
  const bill = (b: BillType) => ({
    count: b.count,
    amountKobo: money(b.amount),
    successes: Math.max(0, b.count - b.failures),
    failures: b.failures,
    pending: 0,
  });

  return {
    deltas: {
      transactions: delta(r.transactions.volume_delta_pct),
      value: delta(r.transactions.value_delta_pct),
      fixedDeposits: delta(r.fixed_deposits.volume_delta_pct),
      targetSavings: delta(r.target_savings.volume_delta_pct),
    },
    valueKobo: money(r.transactions.value),
    series: {
      dates: r.transactions.trend.map((point) => point.date),
      labels: r.transactions.trend.map((point) => dayLabel(point.date)),
      valueKobo: r.transactions.trend.map((point) => money(point.value)),
      volume: r.transactions.trend.map((point) => point.volume),
      byPurpose: (r.transactions.by_purpose ?? []).map((entry) => ({
        purpose: entry.purpose,
        valueKobo: entry.trend.map((point) => money(point.value)),
        volume: entry.trend.map((point) => point.volume),
      })),
    },
    recent: r.recent_transactions.map((row) => ({
      id: row.reference,
      name: row.customer_name ?? "",
      amountKobo: money(row.amount),
      purpose: row.purpose,
      status: row.status,
    })),
    kpis: {
      transactions: {
        total: r.transactions.volume,
        trend: r.transactions.trend.map((point) => point.volume),
      },
      fixedDeposits: {
        total: r.fixed_deposits.volume,
        trend: r.fixed_deposits.trend.map((point) => point.volume),
      },
      targetSavings: {
        total: r.target_savings.volume,
        trend: r.target_savings.trend.map((point) => point.volume),
      },
    },
    transfers: {
      total: count(r.transfers.total),
      successful: count(r.transfers.successful, money(r.transfers.value)),
      failed: count(r.transfers.failed),
      pending: count(r.transfers.pending),
      wallet: count(r.transfers.wallet),
      otherBank: count(r.transfers.other_bank),
      weekday: r.transfers.weekday.map((entry) => ({ label: entry.day, count: entry.count })),
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
    customers: {
      signUps: r.signups.total,
      trend: r.signups.trend.map((point) => point.count),
      male: r.signups.gender.male,
      female: r.signups.gender.female,
      unspecified: r.signups.gender.other + r.signups.gender.unknown,
    },
    savings: {
      fixedTotalKobo: money(r.savings.fixed_deposit_principal + r.savings.fixed_deposit_interest),
      fixedCount: r.fixed_deposits.active.count,
      targetTotalKobo: money(r.savings.target_savings_balance),
      targetCount: r.target_savings.active.count,
    },
  };
}

const NONE: Bucket = { count: 0, amountKobo: 0 };
const NO_BILLS = { ...NONE, successes: 0, failures: 0, pending: 0 };

/** The overview with nothing in it, so each section can show its own empty state. */
export function emptyOverview(days: number): Overview {
  const dates = Array.from({ length: Math.max(days, 2) }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
  const zeros = dates.map(() => 0);
  return {
    deltas: { transactions: 0, value: 0, fixedDeposits: 0, targetSavings: 0 },
    valueKobo: 0,
    series: { dates, labels: dates.map(dayLabel), valueKobo: zeros, volume: zeros, byPurpose: [] },
    recent: [],
    kpis: {
      transactions: { total: 0, trend: zeros },
      fixedDeposits: { total: 0, trend: zeros },
      targetSavings: { total: 0, trend: zeros },
    },
    transfers: {
      total: NONE,
      successful: NONE,
      failed: NONE,
      pending: NONE,
      wallet: NONE,
      otherBank: NONE,
      weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
        label,
        count: 0,
      })),
    },
    bills: { airtime: NO_BILLS, data: NO_BILLS, billers: [] },
    customers: { signUps: 0, trend: zeros, male: 0, female: 0, unspecified: 0 },
    savings: { fixedTotalKobo: 0, fixedCount: 0, targetTotalKobo: 0, targetCount: 0 },
  };
}
