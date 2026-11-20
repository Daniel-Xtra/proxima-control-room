import { request } from "@/shared/api/client";
import { fromApiAmount, toApiAmount } from "@/shared/api/money";
import { formatKobo } from "@/shared/lib/format";
import { t, type MessageKey } from "@/shared/i18n/t";
import type {
  FeeMode,
  FeeRule,
  KillSwitch,
  PendingChange,
  PlatformConfig,
  TierLimit,
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
  const entries = Object.entries(row.payload);
  if (row.type.startsWith("FEE_RULE")) {
    return entries.map(([key, value]) =>
      MONEY_FIELDS.has(key) && typeof value === "number"
        ? `${label(key)}: ${formatKobo(fromApiAmount(value, feeUnit))}`
        : `${label(key)}: ${String(value)}`,
    );
  }
  return entries.map(([key, value]) =>
    typeof value === "number"
      ? `${key === "daily_limit" ? t("config.field.daily") : t("config.field.perTransaction")}: ${formatKobo(fromApiAmount(value, tierUnit))}`
      : `${key}: ${String(value)}`,
  );
}

export async function getConfig(): Promise<PlatformConfig> {
  const data = await request<ConfigResponse>("/admin/platform-config");
  const feeUnit = data.fees.amount_unit;
  const tierUnit = data.limits.amount_unit;

  const fees: FeeRule[] = data.fees.rules.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    scope: [row.transaction_type, row.channel].filter(Boolean).join(" · "),
    mode: row.calculation_type,
    flatKobo: row.flat_amount === null ? null : fromApiAmount(row.flat_amount, feeUnit),
    percent: row.percentage,
    minFeeKobo: row.min_fee_amount === null ? null : fromApiAmount(row.min_fee_amount, feeUnit),
    maxFeeKobo: row.max_fee_amount === null ? null : fromApiAmount(row.max_fee_amount, feeUnit),
    minTransactionKobo:
      row.min_transaction_amount === null
        ? null
        : fromApiAmount(row.min_transaction_amount, feeUnit),
    maxTransactionKobo:
      row.max_transaction_amount === null
        ? null
        : fromApiAmount(row.max_transaction_amount, feeUnit),
    effectiveFrom: row.effective_from,
  }));

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

/** `engaged: true` stops the flow; `false` lets it run again. Takes effect within seconds. */
export async function setKillSwitch(id: string, engaged: boolean, reason: string) {
  await request(`/admin/platform-config/kill-switches/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { enabled: engaged, reason },
  });
}
