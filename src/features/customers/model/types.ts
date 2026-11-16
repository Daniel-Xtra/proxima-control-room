export type CustomerStatus = "active" | "deactivated" | "locked" | "frozen";
export type KycLevel = 0 | 1 | 2;
export type ComplianceStatus = "draft" | "pending" | "approved" | "rejected" | "resubmitted";
export type ComplianceType = "NIN" | "BVN" | "LIVELINESS";

export interface Compliance {
  id: string;
  type: ComplianceType;
  status: ComplianceStatus;
  /** Decrypted by the backend. Masked by default in the UI. */
  value: string;
  approvedAt: string | null;
  documents: string[];
}

export interface FreezeEvent {
  id: string;
  kind: "freeze" | "unfreeze";
  at: string;
  by: string;
  reason: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "unspecified";
  referralCode: string;
  joinedAt: string;
  kycLevel: KycLevel;
  status: CustomerStatus;
  reservedAccount: string;
  balanceKobo: number;
  ledgerBalanceKobo: number;
  moneyInKobo: number;
  moneyOutKobo: number;
  dailyLimitKobo: number;
  perTransactionLimitKobo: number;
  dailyUsedKobo: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  pinSet: boolean;
  addressSet: boolean;
  pinLocked: boolean;
  hasMerchantAccount: boolean;
  loginLock: { failedAttempts: number; remainingAttempts: number; lockedUntil: string | null };
  compliances: Compliance[];
  freezeHistory: FreezeEvent[];
}

export type CustomerRow = Pick<
  Customer,
  | "id"
  | "name"
  | "phone"
  | "email"
  | "reservedAccount"
  | "dailyLimitKobo"
  | "kycLevel"
  | "status"
  | "joinedAt"
>;

export interface CustomerFilters {
  search: string;
  range: string;
  status: string;
  kyc: string;
  /** Sort key and direction ("asc" or "desc"); an empty key keeps the default order. */
  sort: string;
  dir: string;
  page: number;
  limit: number;
}
