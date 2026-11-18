import type { Permission } from "@/features/auth";

export type RequestKind =
  | "freeze"
  | "unfreeze"
  | "limit"
  | "unlock"
  | "password_reset"
  | "reversal"
  | "refund"
  | "staff"
  | "other";
export type StaffAction = "disable" | "enable" | "role" | "mfa_reset";
export type RequestStatus =
  "pending" | "approved" | "rejected" | "cancelled" | "expired" | "failed";

export interface LimitDiff {
  /** The request does not record the limits that were in force, so they are unknown. */
  currentDailyKobo: number | null;
  requestedDailyKobo: number;
  currentPerTransactionKobo: number | null;
  requestedPerTransactionKobo: number;
}

export interface AccountRequest {
  id: string;
  kind: RequestKind;
  /** The approval type code, such as CUSTOMER_FREEZE. */
  type: string;
  /** What the request carries, as the API sent it. */
  payload: Record<string, unknown>;
  /** The customer, or the staff member for staff changes. */
  customerId: string;
  /** Set for staff changes: what is being asked. */
  staffAction?: StaffAction;
  /** Role the staff member would move to. */
  roleCode?: string;
  /** The API returns ids only, so this is a shortened customer id. */
  customerName: string;
  requestedById: string;
  requestedBy: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  adminComment?: string;
  failure?: string;
  limits?: LimitDiff;
}

/**
 * - `assigned`: pending requests this admin may decide
 * - `mine`: requests this admin raised
 * - `all`: every request the admin may see (needs audit access)
 * - `customer`: assigned and mine together, narrowed to `customerId`
 */
export type RequestScope = "assigned" | "mine" | "all" | "customer";

export interface RequestFilters {
  kind?: RequestKind;
  status: string;
  scope: RequestScope;
  customerId?: string;
}

export const APPROVE_PERMISSION: Record<RequestKind, Permission> = {
  freeze: "freeze_request:approve",
  unfreeze: "unfreeze_request:approve",
  limit: "limit_request:approve",
  unlock: "unlock_request:approve",
  password_reset: "password_reset_request:approve",
  reversal: "reversal_request:approve",
  refund: "refund_request:approve",
  staff: "staff_change:approve",
  other: "request:view_all",
};

export const INITIATE_PERMISSION: Record<RequestKind, Permission> = {
  freeze: "freeze_request:initiate",
  unfreeze: "unfreeze_request:initiate",
  limit: "limit_request:initiate",
  unlock: "customer:unlock",
  password_reset: "customer:reset_password",
  reversal: "transaction:reverse",
  refund: "transaction:refund",
  staff: "staff:manage",
  other: "request:view_all",
};
