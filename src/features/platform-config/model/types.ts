export type FeeMode = "flat" | "percentage" | "flat_plus_percentage";

/** A fee the platform charges. Money is integer kobo; the percentage is a plain percent (1.5 = 1.5%). */
export interface FeeRule {
  id: number;
  code: string;
  name: string;
  /** What it applies to, such as the transaction type and channel. */
  scope: string;
  mode: FeeMode;
  flatKobo: number | null;
  percent: number | null;
  minFeeKobo: number | null;
  maxFeeKobo: number | null;
  minTransactionKobo: number | null;
  maxTransactionKobo: number | null;
  effectiveFrom: string;
}

/** A fee that no longer applies, with what is needed to ask for it again. */
export interface TurnedOffFee extends FeeRule {
  /** The rule's settings in the API's names and units. */
  rule: Record<string, unknown>;
}

/** The most a customer on a tier can move. */
export interface TierLimit {
  /** Identifies the tier in change requests, for example "user:tierOneIndividualUser". */
  id: string;
  type: string;
  tier: string;
  /** Retail tiers map to a KYC level; business tiers do not. */
  kycLevel: number | null;
  perTransactionKobo: number;
  dailyKobo: number;
}

export interface KillSwitch {
  id: string;
  name: string;
  description: string;
  /** `true` means the flow is blocked. */
  engaged: boolean;
  changedByName: string | null;
  changedAt: string | null;
  reason: string | null;
}

export type PendingChangeKind = "fee" | "limit" | "other";

/** A fee or limit change waiting for a second admin. */
export interface PendingChange {
  id: string;
  kind: PendingChangeKind;
  type: string;
  targetId: string;
  makerId: string;
  makerName: string | null;
  createdAt: string;
  reason: string;
  /** What would change, already worded for display. */
  summary: string[];
  /** The fee name the change carries, when it has one. A new rule has no row to look it up from. */
  name?: string;
}

export interface PlatformConfig {
  fees: FeeRule[];
  limits: TierLimit[];
  /** The unit the API reports tier limits in. */
  limitUnit: string | undefined;
  switches: KillSwitch[];
  pending: PendingChange[];
}
