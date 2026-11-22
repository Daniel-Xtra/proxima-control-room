/** A fixed deposit term a customer can pick. Money is integer kobo; the rate is a plain percent (10.5 = 10.5%). */
export interface FixedDepositTerm {
  id: number;
  days: number;
  interestPercent: number;
  minKobo: number;
  /** `null` means no upper limit. */
  maxKobo: number | null;
  active: boolean;
}

/** The smallest amounts a customer can use in target savings. Integer kobo. */
export interface TargetSavingsLimits {
  minTargetKobo: number;
  minTopUpKobo: number;
  minWithdrawalKobo: number;
  minRecurringKobo: number;
}

export type SavingsProductType = "fixed_deposit" | "target_savings";

/** The rates behind a savings product. Both are plain percents. */
export interface SavingsProduct {
  code: string;
  type: SavingsProductType;
  name: string;
  interestPercent: number;
  /** The share of the interest earned that is kept when a plan is broken early. */
  breakagePercent: number;
  /** Only the target savings product has limits. */
  limits?: TargetSavingsLimits;
}

/** A settings change waiting for a second admin. */
export interface PendingSettingsChange {
  id: string;
  type: string;
  targetId: string;
  makerId: string;
  makerName: string | null;
  createdAt: string;
  reason: string;
  /** The API names of the fields the change touches. */
  fields: string[];
  /** What would change, already worded for display. */
  summary: string[];
}

export interface SavingsSettings {
  terms: FixedDepositTerm[];
  products: SavingsProduct[];
  pending: PendingSettingsChange[];
}
