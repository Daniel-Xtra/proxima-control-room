export type FixedDepositStatus = "active" | "cancelled" | "matured" | "paid";
export type TargetSavingStatus = "active" | "cancelled" | "matured" | "paid";
export type Frequency = "daily" | "weekly" | "monthly";

export interface FixedDeposit {
  id: string;
  /** The plan name the customer gave it. */
  name: string;
  reference: string;
  customerId: string;
  customerName: string;
  principalKobo: number;
  interestRatePercent: number;
  durationDays: number;
  startedAt: string;
  maturesAt: string;
  locked: boolean;
  status: FixedDepositStatus;
}

export interface TargetSaving {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  name: string;
  targetKobo: number;
  savedKobo: number;
  frequency: Frequency;
  startedAt: string;
  status: TargetSavingStatus;
}

export interface BreakagePreview {
  principalKobo: number;
  accruedInterestKobo: number;
  breakageFeeKobo: number;
  payoutKobo: number;
}

export type SavingsKind = "fixed" | "target";

/** The plan whose activity is being looked at. */
export interface SavingsPlanRef {
  kind: SavingsKind;
  id: string;
  name: string;
  reference: string;
  customerName: string;
}

/** Money in or out of one plan: funding, interest credited, withdrawals and breaking fees. */
export interface PlanTransaction {
  reference: string;
  direction: "inflow" | "outflow";
  purpose: string;
  channel: string;
  amountKobo: number;
  description: string;
  at: string;
}

/** One day's interest added to a plan. */
export interface PlanInterest {
  date: string;
  amountKobo: number;
  /** When it was credited; empty while still pending. */
  creditedAt: string | null;
}
