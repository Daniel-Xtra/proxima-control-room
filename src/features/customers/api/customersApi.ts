import { request, type Page } from "@/shared/api/client";
import { fromApiAmount } from "@/shared/api/money";
import type {
  ComplianceStatus,
  ComplianceType,
  Customer,
  CustomerFilters,
  CustomerRow,
  CustomerStatus,
} from "../model/types";

interface DirectoryItem {
  unique_identifier: string;
  name: string;
  email: string;
  phone_number: string;
  is_enabled: boolean;
  is_kyc_completed: boolean;
  kyc_level: 1 | 2;
  account_number: string | null;
  is_frozen: boolean;
  is_locked: boolean;
  created_at: string;
}

interface DirectoryPage {
  data: DirectoryItem[];
  total: number;
  page: number;
  limit: number;
}

const SORT_KEYS: Record<string, "name" | "email" | "created_at" | undefined> = {
  name: "name",
  email: "email",
  joined: "created_at",
};

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };

function joinedFrom(range: string) {
  const days = RANGE_DAYS[range];
  return days ? new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10) : undefined;
}

/** The directory is searched server-side: it takes a 3+ character search and boolean filters, and cannot sort. */
export async function listCustomers(filters: CustomerFilters): Promise<Page<CustomerRow>> {
  const search = filters.search.trim();
  const result = await request<DirectoryPage>("/admin/customers", {
    query: {
      search: search.length >= 3 ? search : undefined,
      is_enabled: filters.status === "deactivated" ? false : undefined,
      frozen: filters.status === "frozen" ? true : filters.status === "active" ? false : undefined,
      locked: filters.status === "locked" ? true : filters.status === "active" ? false : undefined,
      is_kyc_completed: filters.kyc === "yes" ? true : filters.kyc === "no" ? false : undefined,
      kyc_level: filters.kyc === "1" || filters.kyc === "2" ? Number(filters.kyc) : undefined,
      joined_from: joinedFrom(filters.range),
      sort: SORT_KEYS[filters.sort],
      dir: SORT_KEYS[filters.sort] ? filters.dir : undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
  return {
    items: result.data.map((item) => ({
      id: item.unique_identifier,
      name: item.name,
      phone: item.phone_number,
      email: item.email,
      kycLevel: item.kyc_level,
      reservedAccount: item.account_number,
      status: !item.is_enabled
        ? "deactivated"
        : item.is_frozen
          ? "frozen"
          : item.is_locked
            ? "locked"
            : "active",
      joinedAt: item.created_at,
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

interface Overview {
  profile: {
    unique_identifier: string;
    name: string;
    email: string;
    phone_number: string;
    membership_type: string;
    is_enabled: boolean;
    email_verified: boolean;
    phone_verified: boolean;
    created_at: string;
    gender: string | null;
    referral_code: string | null;
    kyc_level: 1 | 2;
    reserved_account_number: string | null;
    reserved_account_bank?: string | null;
    amount_unit?: string;
  };
  identity?: {
    bvn: { number: string | null; status: string } | null;
    nin: { number: string | null; status: string } | null;
  };
  onboarding: {
    is_kyc_completed: boolean;
    is_transaction_pin_set: boolean;
    is_address_set: boolean;
    verifications: {
      type: string;
      document_name?: string | null;
      status: string;
      approved_at: string | null;
    }[];
  };
  account: { is_frozen: boolean } | null;
  wallet: {
    balance: number;
    ledger_balance: number;
    money_in: number;
    money_out: number;
  } | null;
  limits: { daily_limit: number; transaction_limit: number; current_daily_total: number } | null;
  security: {
    login_locked: boolean;
    login_locked_until: string | null;
    failed_login_attempts: number;
    pin_locked: boolean;
  };
  freeze_history: {
    freeze_reason: string | null;
    unfreeze_reason: string | null;
    date_frozen: string | null;
    date_unfrozen: string | null;
  }[];
}

const COMPLIANCE_TYPES: ComplianceType[] = ["NIN", "BVN", "LIVELINESS"];
const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "resubmitted",
];
const MAX_LOGIN_ATTEMPTS = 5;

function toCustomer(o: Overview): Customer {
  const unit = o.profile.amount_unit;
  const [firstName = "", ...rest] = o.profile.name.split(" ");
  const compliances = o.onboarding.verifications.flatMap((v, index) => {
    const type = v.type.toUpperCase() as ComplianceType;
    if (!COMPLIANCE_TYPES.includes(type)) return [];
    const status = v.status.toLowerCase() as ComplianceStatus;
    return [
      {
        id: `${o.profile.unique_identifier}-${index}`,
        type,
        status: COMPLIANCE_STATUSES.includes(status) ? status : ("pending" as const),
        // BVN and NIN arrive masked to their last four digits.
        value:
          (type === "BVN"
            ? o.identity?.bvn?.number
            : type === "NIN"
              ? o.identity?.nin?.number
              : null) ?? "",
        approvedAt: v.approved_at,
        documents: v.document_name ? [v.document_name] : [],
      },
    ];
  });
  const failed = o.security.failed_login_attempts;
  const status: CustomerStatus = !o.profile.is_enabled
    ? "deactivated"
    : o.account?.is_frozen
      ? "frozen"
      : o.security.login_locked
        ? "locked"
        : "active";
  return {
    id: o.profile.unique_identifier,
    firstName,
    lastName: rest.join(" "),
    name: o.profile.name,
    email: o.profile.email,
    phone: o.profile.phone_number,
    dateOfBirth: null,
    gender:
      o.profile.gender === "male" || o.profile.gender === "female"
        ? o.profile.gender
        : "unspecified",
    referralCode: o.profile.referral_code,
    joinedAt: o.profile.created_at,
    kycLevel: o.profile.kyc_level,
    kycCompleted: o.onboarding.is_kyc_completed,
    status,
    reservedAccount: o.profile.reserved_account_number,
    reservedBank: o.profile.reserved_account_bank ?? null,
    balanceKobo: fromApiAmount(o.wallet?.balance, unit),
    ledgerBalanceKobo: fromApiAmount(o.wallet?.ledger_balance, unit),
    moneyInKobo: fromApiAmount(o.wallet?.money_in, unit),
    moneyOutKobo: fromApiAmount(o.wallet?.money_out, unit),
    dailyLimitKobo: fromApiAmount(o.limits?.daily_limit, unit),
    perTransactionLimitKobo: fromApiAmount(o.limits?.transaction_limit, unit),
    dailyUsedKobo: fromApiAmount(o.limits?.current_daily_total, unit),
    phoneVerified: o.profile.phone_verified,
    emailVerified: o.profile.email_verified,
    pinSet: o.onboarding.is_transaction_pin_set,
    addressSet: o.onboarding.is_address_set,
    pinLocked: o.security.pin_locked,
    hasMerchantAccount: o.profile.membership_type === "merchant",
    loginLock: {
      failedAttempts: failed,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - failed),
      lockedUntil: o.security.login_locked_until,
    },
    compliances,
    freezeHistory: o.freeze_history.flatMap((event, index) => {
      const events: Customer["freezeHistory"] = [];
      if (event.date_frozen)
        events.push({
          id: `${index}-freeze`,
          kind: "freeze",
          at: event.date_frozen,
          by: "",
          reason: event.freeze_reason ?? "",
        });
      if (event.date_unfrozen)
        events.push({
          id: `${index}-unfreeze`,
          kind: "unfreeze",
          at: event.date_unfrozen,
          by: "",
          reason: event.unfreeze_reason ?? "",
        });
      return events;
    }),
  };
}

export async function getCustomer(id: string): Promise<Customer> {
  return toCustomer(await request<Overview>(`/admin/customers/${encodeURIComponent(id)}/overview`));
}

export async function repairBankOneCustomer(id: string, _reason: string) {
  const result = await request<{ success: boolean; customer_created: boolean }>(
    "/admin/bankone-repair/repair/single",
    { method: "POST", body: { user_unique_identifier: id } },
  );
  return { customerCreated: result.customer_created };
}

export type UnmaskField = "email" | "phone_number" | "date_of_birth";

/** Reveals chosen fields. The API needs a fresh MFA step-up and a written reason, and audits the access. */
export function unmaskCustomer(id: string, fields: UnmaskField[], reason: string) {
  return request<Partial<Record<UnmaskField, string | null>>>(
    `/admin/customers/${encodeURIComponent(id)}/unmask`,
    { method: "POST", body: { fields, reason } },
  );
}
