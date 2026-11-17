import { request } from "@/shared/api/client";
import { fromApiAmount } from "@/shared/api/money";
import { unavailable } from "@/shared/api/unavailable";
import type {
  BreakagePreview,
  FixedDeposit,
  FixedDepositStatus,
  Frequency,
  TargetSaving,
  TargetSavingStatus,
} from "../model/types";

interface FixedRow {
  id: string;
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

const query = (customerId?: string) => ({ customer_id: customerId, limit: 100 });

export async function listFixedDeposits(customerId?: string): Promise<FixedDeposit[]> {
  const page = await request<{ data: FixedRow[] }>("/admin/savings/fixed-deposits", {
    query: query(customerId),
  });
  return page.data.map((row) => ({
    id: row.id,
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
}

export async function listTargetSavings(customerId?: string): Promise<TargetSaving[]> {
  const page = await request<{ data: TargetRow[] }>("/admin/savings/target-savings", {
    query: query(customerId),
  });
  return page.data.map((row) => ({
    id: row.id,
    customerId: row.customer_id ?? "",
    customerName: row.customer_name ?? "",
    name: row.name,
    targetKobo: fromApiAmount(row.target, row.amount_unit),
    savedKobo: fromApiAmount(row.saved, row.amount_unit),
    frequency: row.frequency,
    startedAt: row.start_date,
    status: row.status,
  }));
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
