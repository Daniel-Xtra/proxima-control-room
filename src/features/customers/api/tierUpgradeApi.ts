import { request } from "@/shared/api/client";
import { fromApiAmount } from "@/shared/api/money";

export type RequirementKey =
  "bvn" | "nin" | "liveness" | "address" | "identification" | "utility_bill";

export interface TierLimits {
  dailyKobo: number;
  perTransactionKobo: number;
}

export interface TierUpgrade {
  currentLevel: number;
  targetLevel: number;
  requirements: { key: RequirementKey; met: boolean }[];
  eligible: boolean;
  blockedReason: "already_upgraded" | "account_disabled" | null;
  currentLimits: TierLimits | null;
  newLimits: TierLimits;
}

interface LimitRow {
  daily_limit: number;
  transaction_limit: number;
}

interface TierUpgradeResponse {
  current_level: number;
  target_level: number;
  requirements: { key: RequirementKey; met: boolean }[];
  eligible: boolean;
  blocked_reason: TierUpgrade["blockedReason"];
  current_limits: LimitRow | null;
  new_limits: LimitRow;
}

const toLimits = (row: LimitRow): TierLimits => ({
  dailyKobo: fromApiAmount(row.daily_limit),
  perTransactionKobo: fromApiAmount(row.transaction_limit),
});

/** What still stands between a retail customer and the next level. */
export async function getTierUpgrade(userId: string): Promise<TierUpgrade> {
  const data = await request<TierUpgradeResponse>(
    `/admin/kyc/retail/${encodeURIComponent(userId)}/tier-upgrade`,
  );
  return {
    currentLevel: data.current_level,
    targetLevel: data.target_level,
    requirements: data.requirements,
    eligible: data.eligible,
    blockedReason: data.blocked_reason,
    currentLimits: data.current_limits ? toLimits(data.current_limits) : null,
    newLimits: toLimits(data.new_limits),
  };
}
