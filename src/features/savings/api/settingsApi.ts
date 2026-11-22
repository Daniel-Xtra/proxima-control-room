import { request } from "@/shared/api/client";
import { formatKobo } from "@/shared/lib/format";
import { t, type MessageKey } from "@/shared/i18n/t";
import type {
  FixedDepositTerm,
  PendingSettingsChange,
  SavingsProduct,
  SavingsProductType,
  SavingsSettings,
} from "../model/settingsTypes";

interface TermRow {
  id: number;
  duration: number;
  interest: number;
  minimum_amount: number;
  maximum_amount: number | null;
  is_active: boolean;
}

interface ProductRow {
  code: string;
  product_type: SavingsProductType;
  name: string;
  interest_rate: number;
  breakage_percentage_on_interest: number;
  min_target_amount?: number;
  min_top_up_amount?: number;
  min_withdrawal_amount?: number;
  min_recurring_amount?: number;
}

interface PendingRow {
  id: string;
  type: string;
  target_id: string;
  payload: Record<string, unknown>;
  reason: string;
  maker_unique_identifier: string;
  maker_name: string | null;
  created_at: string;
}

interface SettingsResponse {
  terms: TermRow[];
  products: ProductRow[];
  pending: PendingRow[];
}

const FIELDS: Record<string, MessageKey> = {
  duration: "savingsSettings.field.days",
  interest: "savingsSettings.field.interest",
  minimum_amount: "savingsSettings.field.min",
  maximum_amount: "savingsSettings.field.max",
  is_active: "savingsSettings.field.active",
  interest_rate: "savingsSettings.field.interest",
  breakage_percentage_on_interest: "savingsSettings.field.breakage",
  min_target_amount: "savingsSettings.limit.minTarget",
  min_top_up_amount: "savingsSettings.limit.minTopUp",
  min_withdrawal_amount: "savingsSettings.limit.minWithdrawal",
  min_recurring_amount: "savingsSettings.limit.minRecurring",
};

const MONEY = new Set([
  "minimum_amount",
  "maximum_amount",
  "min_target_amount",
  "min_top_up_amount",
  "min_withdrawal_amount",
  "min_recurring_amount",
]);
const PERCENT = new Set(["interest", "interest_rate", "breakage_percentage_on_interest"]);

/** One value in words: money in naira, rates with a percent sign, a missing limit as "No limit". */
function show(key: string, value: unknown): string {
  if (value === null || value === undefined) return t("savingsSettings.noLimit");
  if (MONEY.has(key) && typeof value === "number") return formatKobo(value);
  if (PERCENT.has(key) && typeof value === "number") return `${value}%`;
  if (key === "is_active") return value ? t("savingsSettings.on") : t("savingsSettings.off");
  return String(value);
}

/** Each changed field with its old and new value. A new term has no old values and just lists the new ones. */
function describe(row: PendingRow): string[] {
  const { previous, ...changes } = row.payload as { previous?: Record<string, unknown> } & Record<
    string,
    unknown
  >;
  return Object.entries(changes).map(([key, value]) => {
    const label = t(FIELDS[key] ?? "savingsSettings.field.other");
    return previous && key in previous
      ? `${label}: ${show(key, previous[key])} → ${show(key, value)}`
      : `${label}: ${show(key, value)}`;
  });
}

export async function getSavingsSettings(): Promise<SavingsSettings> {
  const data = await request<SettingsResponse>("/admin/savings-settings");
  const terms: FixedDepositTerm[] = data.terms.map((row) => ({
    id: row.id,
    days: row.duration,
    interestPercent: row.interest,
    minKobo: row.minimum_amount,
    maxKobo: row.maximum_amount,
    active: row.is_active,
  }));
  const products: SavingsProduct[] = data.products.map((row) => ({
    code: row.code,
    type: row.product_type,
    name: row.name,
    interestPercent: row.interest_rate,
    breakagePercent: row.breakage_percentage_on_interest,
    ...(row.product_type === "target_savings" && row.min_target_amount !== undefined
      ? {
          limits: {
            minTargetKobo: row.min_target_amount,
            minTopUpKobo: row.min_top_up_amount ?? 0,
            minWithdrawalKobo: row.min_withdrawal_amount ?? 0,
            minRecurringKobo: row.min_recurring_amount ?? 0,
          },
        }
      : {}),
  }));
  const pending: PendingSettingsChange[] = data.pending.map((row) => ({
    id: row.id,
    type: row.type,
    targetId: row.target_id,
    makerId: row.maker_unique_identifier,
    makerName: row.maker_name,
    createdAt: row.created_at,
    reason: row.reason,
    fields: Object.keys(row.payload).filter((key) => key !== "previous"),
    summary: describe(row),
  }));
  return { terms, products, pending };
}

const idempotent = () => ({ "Idempotency-Key": crypto.randomUUID() });

export interface NewTerm {
  days: number;
  interestPercent: number;
  minKobo: number;
  maxKobo: number | null;
}

export async function requestTermCreate(term: NewTerm, reason: string) {
  await request("/admin/savings-settings/terms", {
    method: "POST",
    headers: idempotent(),
    body: {
      duration: term.days,
      interest: term.interestPercent,
      minimum_amount: term.minKobo,
      ...(term.maxKobo === null ? {} : { maximum_amount: term.maxKobo }),
      reason,
    },
  });
}

/** `changes` holds only the fields that differ, in the API's names; money in kobo. */
export async function requestTermChange(
  termId: number,
  changes: Record<string, unknown>,
  reason: string,
) {
  await request(`/admin/savings-settings/terms/${termId}/change`, {
    method: "POST",
    headers: idempotent(),
    body: { changes, reason },
  });
}

export async function requestProductChange(
  code: string,
  changes: Record<string, unknown>,
  reason: string,
) {
  await request(`/admin/savings-settings/products/${encodeURIComponent(code)}/change`, {
    method: "POST",
    headers: idempotent(),
    body: { changes, reason },
  });
}

/** Approves or rejects a waiting settings change. */
export async function decideSettingsChange(id: string, approve: boolean, reason: string) {
  await request(`/admin/approvals/${encodeURIComponent(id)}/${approve ? "approve" : "reject"}`, {
    method: "POST",
    body: approve ? { comment: reason } : { reason },
  });
}
