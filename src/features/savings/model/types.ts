export type FixedDepositStatus = "active" | "matured" | "liquidated" | "paid";
export type TargetSavingStatus = "active" | "cancelled" | "matured" | "paid";
export type Frequency = "daily" | "weekly" | "monthly";

export interface FixedDeposit {
  id: string;
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
