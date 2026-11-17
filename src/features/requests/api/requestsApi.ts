import { request } from "@/shared/api/client";
import { fromApiAmount, toApiAmount } from "@/shared/api/money";
import type {
  AccountRequest,
  LimitDiff,
  RequestFilters,
  RequestKind,
  RequestScope,
  RequestStatus,
  StaffAction,
} from "../model/types";

type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "EXECUTING"
  | "EXECUTED"
  | "EXECUTION_FAILED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

interface Approval {
  id: string;
  type: string;
  target_id: string;
  payload: { daily_limit?: number; transaction_limit?: number; role_code?: string };
  reason: string;
  status: ApprovalStatus;
  maker_unique_identifier: string;
  checker_unique_identifier: string | null;
  decision_reason: string | null;
  decided_at: string | null;
  failure: string | null;
  created_at: string;
}

interface ApprovalPage {
  data: Approval[];
  total: number;
  page: number;
  limit: number;
}

const KIND_TO_TYPE = {
  freeze: "CUSTOMER_FREEZE",
  unfreeze: "CUSTOMER_UNFREEZE",
  limit: "CUSTOMER_LIMIT_CHANGE",
  unlock: "CUSTOMER_UNLOCK_LOGIN",
  password_reset: "CUSTOMER_PASSWORD_RESET",
  reversal: "TXN_REVERSAL",
  refund: "TXN_REFUND",
} as const;

const TYPE_TO_KIND: Record<string, RequestKind> = {
  CUSTOMER_FREEZE: "freeze",
  CUSTOMER_UNFREEZE: "unfreeze",
  CUSTOMER_LIMIT_CHANGE: "limit",
  CUSTOMER_UNLOCK_LOGIN: "unlock",
  CUSTOMER_PASSWORD_RESET: "password_reset",
  TXN_REVERSAL: "reversal",
  TXN_REFUND: "refund",
  STAFF_DISABLE: "staff",
  STAFF_ENABLE: "staff",
  STAFF_ROLE_CHANGE: "staff",
  STAFF_MFA_RESET: "staff",
};

const STAFF_ACTION: Record<string, StaffAction> = {
  STAFF_DISABLE: "disable",
  STAFF_ENABLE: "enable",
  STAFF_ROLE_CHANGE: "role",
  STAFF_MFA_RESET: "mfa_reset",
};

const STATUS: Record<ApprovalStatus, RequestStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  EXECUTING: "approved",
  EXECUTED: "approved",
  EXECUTION_FAILED: "failed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

const short = (id: string) => id.slice(0, 8);

function toRequest(a: Approval): AccountRequest | null {
  const kind = TYPE_TO_KIND[a.type];
  if (!kind) return null;
  const limits: LimitDiff | undefined =
    kind === "limit" && a.payload.daily_limit !== undefined
      ? {
          currentDailyKobo: null,
          requestedDailyKobo: fromApiAmount(a.payload.daily_limit),
          currentPerTransactionKobo: null,
          requestedPerTransactionKobo: fromApiAmount(a.payload.transaction_limit ?? 0),
        }
      : undefined;
  return {
    id: a.id,
    kind,
    customerId: a.target_id,
    customerName: short(a.target_id),
    ...(STAFF_ACTION[a.type] ? { staffAction: STAFF_ACTION[a.type] } : {}),
    ...(a.payload.role_code ? { roleCode: a.payload.role_code } : {}),
    requestedById: a.maker_unique_identifier,
    requestedBy: short(a.maker_unique_identifier),
    reason: a.reason,
    status: STATUS[a.status],
    createdAt: a.created_at,
    ...(a.checker_unique_identifier ? { decidedBy: short(a.checker_unique_identifier) } : {}),
    ...(a.decided_at ? { decidedAt: a.decided_at } : {}),
    ...(a.decision_reason ? { adminComment: a.decision_reason } : {}),
    ...(a.failure ? { failure: a.failure } : {}),
    limits,
  };
}

function fetchScope(scope: Exclude<RequestScope, "customer">, type?: string) {
  return request<ApprovalPage>("/admin/approvals", { query: { scope, type, limit: 100 } });
}

export async function listRequests(filters: RequestFilters): Promise<AccountRequest[]> {
  // Staff changes span several approval types, so they are narrowed after the fetch.
  const type = filters.kind && filters.kind !== "staff" ? KIND_TO_TYPE[filters.kind] : undefined;
  const pages =
    filters.scope === "customer"
      ? await Promise.all([fetchScope("assigned", type), fetchScope("mine", type)])
      : [await fetchScope(filters.scope, type)];
  const seen = new Set<string>();
  return pages
    .flatMap((page) => page.data)
    .filter((a) => !seen.has(a.id) && seen.add(a.id))
    .map(toRequest)
    .filter((r): r is AccountRequest => r !== null)
    .filter((r) => !filters.kind || r.kind === filters.kind)
    .filter((r) => !filters.customerId || r.customerId === filters.customerId)
    .filter((r) => filters.status === "all" || r.status === filters.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Pending requests waiting for this admin's decision. */
export async function countPending(): Promise<number> {
  const page = await request<ApprovalPage>("/admin/approvals", {
    query: { scope: "assigned", limit: 1 },
  });
  return page.total;
}

export interface NewRequest {
  kind: Exclude<RequestKind, "staff" | "reversal" | "refund">;
  customerId: string;
  reason: string;
  limits?: { dailyKobo: number; perTransactionKobo: number };
}

const CREATE_PATH: Record<Exclude<RequestKind, "staff" | "reversal" | "refund">, string> = {
  freeze: "freeze-requests",
  unfreeze: "unfreeze-requests",
  limit: "limit-requests",
  unlock: "unlock-requests",
  password_reset: "password-reset-requests",
};

export function createRequest(input: NewRequest) {
  return request<Approval>(
    `/admin/customers/${encodeURIComponent(input.customerId)}/${CREATE_PATH[input.kind]}`,
    {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: {
        reason: input.reason,
        ...(input.limits
          ? {
              daily_limit: toApiAmount(input.limits.dailyKobo),
              transaction_limit: toApiAmount(input.limits.perTransactionKobo),
            }
          : {}),
      },
    },
  );
}

export function decideRequest(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}) {
  const path = input.decision === "approved" ? "approve" : "reject";
  return request<Approval>(`/admin/approvals/${encodeURIComponent(input.id)}/${path}`, {
    method: "POST",
    body: input.decision === "approved" ? { comment: input.comment } : { reason: input.comment },
  });
}
