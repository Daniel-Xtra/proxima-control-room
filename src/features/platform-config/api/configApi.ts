import { request } from "@/shared/api/client";
import { fromApiAmount, toApiAmount } from "@/shared/api/money";
import { formatKobo } from "@/shared/lib/format";
import { t, type MessageKey } from "@/shared/i18n/t";
import type { BillServices } from "../model/billServices";
import { turnedOff } from "../model/turnedOffFees";
import type {
  FeeMode,
  FeeRule,
  KillSwitch,
  PendingChange,
  PlatformConfig,
  TierLimit,
  TurnedOffFee,
} from "../model/types";

interface FeeRow {
  id: number;
  code: string;
  name: string;
  transaction_type: string | null;
  channel: string | null;
  calculation_type: FeeMode;
  flat_amount: number | null;
  percentage: number | null;
  min_fee_amount: number | null;
  max_fee_amount: number | null;
  min_transaction_amount: number | null;
  max_transaction_amount: number | null;
  effective_from: string;
}

interface TierRow {
  id: string;
  type: string;
  tier: string;
  kyc_level: number | null;
  daily_limit: number;
  per_txn_limit: number;
}

interface SwitchRow {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  changed_by_name: string | null;
  changed_at: string | null;
  last_reason: string | null;
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

interface ConfigResponse {
  fees: { amount_unit?: string; rules: FeeRow[] };
  limits: { amount_unit?: string; tiers: TierRow[] };
  kill_switches: SwitchRow[];
  pending_changes: PendingRow[];
}

const FEE_FIELDS: Record<string, MessageKey> = {
  name: "config.field.name",
  calculation_type: "config.field.mode",
  flat_amount: "config.field.flat",
  percentage: "config.field.percent",
  min_fee_amount: "config.field.minFee",
  max_fee_amount: "config.field.maxFee",
  min_transaction_amount: "config.field.minTransaction",
  max_transaction_amount: "config.field.maxTransaction",
  effective_from: "config.field.effectiveFrom",
};

const MONEY_FIELDS = new Set([
  "flat_amount",
  "min_fee_amount",
  "max_fee_amount",
  "min_transaction_amount",
  "max_transaction_amount",
]);

const label = (key: string) => t(FEE_FIELDS[key] ?? "config.field.other");

/** The change in words: each field and its new value. */
function describePending(
  row: PendingRow,
  feeUnit: string | undefined,
  tierUnit: string | undefined,
) {
  if (row.type === "FEE_RULE_DEACTIVATE") return [t("config.fees.off.pending")];
  const entries = Object.entries(row.payload);
  if (row.type.startsWith("FEE_RULE")) {
    const creating = row.type === "FEE_RULE_CREATE";
    const lines = entries
      .filter(([key, value]) => key in FEE_FIELDS && value !== null)
      .filter(([key]) => !(creating && key === "effective_from"))
      .map(([key, value]) =>
        MONEY_FIELDS.has(key) && typeof value === "number"
          ? `${label(key)}: ${formatKobo(fromApiAmount(value, feeUnit))}`
          : `${label(key)}: ${String(value)}`,
      );
    return creating ? [t("config.fees.on.pending"), ...lines] : lines;
  }
  return entries.map(([key, value]) =>
    typeof value === "number"
      ? `${key === "daily_limit" ? t("config.field.daily") : t("config.field.perTransaction")}: ${formatKobo(fromApiAmount(value, tierUnit))}`
      : `${key}: ${String(value)}`,
  );
}

function toFee(row: FeeRow, unit: string | undefined): FeeRule {
  const money = (value: number | null) => (value === null ? null : fromApiAmount(value, unit));
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    scope: [row.transaction_type, row.channel].filter(Boolean).join(" · "),
    mode: row.calculation_type,
    flatKobo: money(row.flat_amount),
    percent: row.percentage,
    minFeeKobo: money(row.min_fee_amount),
    maxFeeKobo: money(row.max_fee_amount),
    minTransactionKobo: money(row.min_transaction_amount),
    maxTransactionKobo: money(row.max_transaction_amount),
    effectiveFrom: row.effective_from,
  };
}

export async function getConfig(): Promise<PlatformConfig> {
  const data = await request<ConfigResponse>("/admin/platform-config");
  const feeUnit = data.fees.amount_unit;
  const tierUnit = data.limits.amount_unit;

  const fees = data.fees.rules.map((row) => toFee(row, feeUnit));

  const limits: TierLimit[] = data.limits.tiers.map((row) => ({
    id: row.id,
    type: row.type,
    tier: row.tier,
    kycLevel: row.kyc_level,
    perTransactionKobo: fromApiAmount(row.per_txn_limit, tierUnit),
    dailyKobo: fromApiAmount(row.daily_limit, tierUnit),
  }));

  const switches: KillSwitch[] = data.kill_switches.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    engaged: row.enabled,
    changedByName: row.changed_by_name,
    changedAt: row.changed_at,
    reason: row.last_reason,
  }));

  const pending: PendingChange[] = data.pending_changes.map((row) => ({
    id: row.id,
    kind: row.type.startsWith("FEE_RULE") ? "fee" : row.type.includes("TIER") ? "limit" : "other",
    type: row.type,
    targetId: row.target_id,
    makerId: row.maker_unique_identifier,
    makerName: row.maker_name,
    createdAt: row.created_at,
    reason: row.reason,
    summary: describePending(row, feeUnit, tierUnit),
    ...(typeof row.payload.name === "string" ? { name: row.payload.name } : {}),
  }));

  return { fees, limits, limitUnit: tierUnit, switches, pending };
}

export interface FeeChange {
  id: number;
  /** Only the fields that changed, in the API's names and units (kobo). */
  changes: Record<string, unknown>;
}

export async function requestFeeChanges(fees: FeeChange[], reason: string) {
  return request<{ failed: number; results: { ok: boolean; key: string; error?: string }[] }>(
    "/admin/platform-config/fees/change-requests",
    { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: { fees, reason } },
  );
}

/**
 * Asks for a fee rule to be turned off. The acknowledgement tells the API the admin accepts that the fee becomes
 * zero when no other active rule covers the same charge.
 */
export async function requestFeeTurnOff(id: number, reason: string) {
  await request(`/admin/fee-rules/${id}/deactivate`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: { reason, acknowledge_zero_fee: true },
  });
}

/** What the fee endpoints return for a rule, beyond what the table shows. */
interface FeeRuleRow extends FeeRow {
  customer_segment: string | null;
  biller_code: string | null;
  business_id: string | null;
  product_code: string | null;
  currency: string;
}

async function listFeeRules(active: boolean): Promise<FeeRuleRow[]> {
  const rows: FeeRuleRow[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = await request<{ data: FeeRuleRow[]; totalPages: number }>("/admin/fee-rules", {
      query: { is_active: active, page, limit: 100 },
    });
    rows.push(...data.data);
    if (page >= data.totalPages) break;
  }
  return rows;
}

export async function listTurnedOffFees(): Promise<TurnedOffFee[]> {
  const [inactive, active] = await Promise.all([listFeeRules(false), listFeeRules(true)]);
  return turnedOff(inactive, active).map((row) => ({
    ...toFee(row, "kobo"),
    // The API has no "turn on", so the same settings are sent as a new rule, effective once approved.
    rule: {
      code: row.code,
      name: row.name,
      transaction_type: row.transaction_type,
      channel: row.channel,
      customer_segment: row.customer_segment,
      biller_code: row.biller_code,
      business_id: row.business_id,
      product_code: row.product_code,
      currency: row.currency,
      calculation_type: row.calculation_type,
      flat_amount: row.flat_amount,
      percentage: row.percentage,
      min_fee_amount: row.min_fee_amount,
      max_fee_amount: row.max_fee_amount,
      min_transaction_amount: row.min_transaction_amount,
      max_transaction_amount: row.max_transaction_amount,
    },
  }));
}

/** Asks for a turned-off fee to apply again. */
export async function requestFeeTurnOn(rule: TurnedOffFee["rule"], reason: string) {
  await request("/admin/fee-rules", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: { rule, reason },
  });
}

export interface LimitChange {
  type: string;
  tier: string;
  dailyKobo: number;
  perTransactionKobo: number;
}

/** Tier limits are reported in the unit the config response names; changes go back in it. */
export async function requestLimitChanges(
  limits: LimitChange[],
  unit: string | undefined,
  reason: string,
) {
  return request<{ failed: number; results: { ok: boolean; key: string; error?: string }[] }>(
    "/admin/platform-config/limits/change-requests",
    {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: {
        limits: limits.map((limit) => ({
          type: limit.type,
          tier: limit.tier,
          daily_limit: toApiAmount(limit.dailyKobo, unit),
          per_txn_limit: toApiAmount(limit.perTransactionKobo, unit),
        })),
        reason,
      },
    },
  );
}

/** Approves or rejects a waiting fee or limit change. */
export async function decideChange(id: string, approve: boolean, reason: string) {
  await request(`/admin/approvals/${encodeURIComponent(id)}/${approve ? "approve" : "reject"}`, {
    method: "POST",
    body: approve ? { comment: reason } : { reason },
  });
}

export const listBillServices = () => request<BillServices>("/admin/platform-config/bill-services");

/** Switches a whole bill type on or off. */
export async function setBillType(id: number, enabled: boolean, reason: string) {
  await request(`/admin/platform-config/bill-services/groups/${id}`, {
    method: "POST",
    body: { enabled, reason },
  });
}

/** Switches several billers at once, under one reason. */
export async function setBillers(enable: number[], disable: number[], reason: string) {
  await request("/admin/platform-config/bill-services/billers", {
    method: "POST",
    body: { enable, disable, reason },
  });
}

/** `engaged: true` stops the flow; `false` lets it run again. Takes effect within seconds. */
export async function setKillSwitch(id: string, engaged: boolean, reason: string) {
  await request(`/admin/platform-config/kill-switches/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { enabled: engaged, reason },
  });
}
