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
  dateOfBirth: string | null;
  gender: "male" | "female" | "unspecified";
  referralCode: string | null;
  joinedAt: string;
  kycLevel: KycLevel;
  /** Whether the customer has finished KYC (the account tier is separate). */
  kycCompleted: boolean;
  /** The customer's compliance documents have been approved. */
  complianceDocsSet: boolean;
  status: CustomerStatus;
  reservedAccount: string | null;
  /** The bank that holds the reserved account. */
  reservedBank: string | null;
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

/** One row of the masked customer directory. Email and phone arrive already masked. */
export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  kycLevel: KycLevel;
  reservedAccount: string | null;
  status: CustomerStatus;
  joinedAt: string;
}

export interface CustomerFilters {
  search: string;
  /** "all", "active", "locked", "frozen" or "deactivated". */
  status: string;
  /** "all", "yes" (completed), "no" (not completed), "1" or "2" (KYC level). */
  kyc: string;
  /** "all", "7d", "30d", "90d" or "365d": how recently they joined. */
  range: string;
  /** "name", "email" or "joined"; empty keeps newest first. */
  sort: string;
  dir: string;
  page: number;
  limit: number;
}

export type UpgradeStatus = "pending" | "resubmitted" | "approved" | "rejected";

/** A customer who finished uploading documents, and where the review for their next tier stands. */
export interface UpgradeRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentTier: number;
  targetTier: number;
  status: UpgradeStatus;
  /** Documents submitted, and how many of them still wait for a decision. */
  documents: number;
  awaitingDocuments: number;
  submittedAt: string;
}

export interface UpgradeRequestFilters {
  search: string;
  /** "all", or one of the statuses above. */
  status: string;
  page: number;
  limit: number;
}
