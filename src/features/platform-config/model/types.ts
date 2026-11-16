export const FEE_IDS = [
  "transferBank",
  "transferInternal",
  "bill",
  "bulk",
  "earlyWithdrawal",
] as const;
export type FeeId = (typeof FEE_IDS)[number];

export type FeeMode = "flat" | "percent";

/** What a service charges. Money is integer kobo, the percentage is in basis points (100 = 1%). */
export interface FeeRule {
  id: FeeId;
  mode: FeeMode;
  flatKobo: number;
  percentBps: number;
  /** The most a percentage fee can reach. 0 means no cap. */
  capKobo: number;
}

export const TIERS = ["none", "level1", "level2"] as const;
export type Tier = (typeof TIERS)[number];

export interface LimitRule {
  tier: Tier;
  singleKobo: number;
  dailyKobo: number;
}

export const SWITCH_IDS = [
  "transfers",
  "bills",
  "bulk",
  "savings",
  "signups",
  "broadcasts",
] as const;
export type SwitchId = (typeof SWITCH_IDS)[number];

export interface KillSwitch {
  id: SwitchId;
  /** `true` means the service is running. */
  enabled: boolean;
  changedBy: string;
  changedAt: string;
  reason: string;
}

interface PendingBase {
  proposedBy: string;
  proposedAt: string;
  reason: string;
}
export interface PendingFees extends PendingBase {
  fees: FeeRule[];
}
export interface PendingLimits extends PendingBase {
  limits: LimitRule[];
}

export type Section = "fees" | "limits";

export interface PlatformConfig {
  /** Goes up every time an approved change lands, so editors reset to the live values. */
  version: number;
  fees: FeeRule[];
  limits: LimitRule[];
  switches: KillSwitch[];
  pendingFees: PendingFees | null;
  pendingLimits: PendingLimits | null;
}
