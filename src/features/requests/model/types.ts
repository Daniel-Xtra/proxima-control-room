import type { Permission } from "@/features/auth";

export type RequestKind = "freeze" | "unfreeze" | "limit";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface LimitDiff {
  currentDailyKobo: number;
  requestedDailyKobo: number;
  currentPerTransactionKobo: number;
  requestedPerTransactionKobo: number;
}

export interface AccountRequest {
  id: string;
  kind: RequestKind;
  customerId: string;
  customerName: string;
  requestedBy: string;
  reason: string;
  staffComment: string;
  status: RequestStatus;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  adminComment?: string;
  limits?: LimitDiff;
}

export interface RequestFilters {
  kind?: RequestKind;
  status: string;
  customerId?: string;
  requestedBy?: string;
}

export const APPROVE_PERMISSION: Record<RequestKind, Permission> = {
  freeze: "freeze_request:approve",
  unfreeze: "unfreeze_request:approve",
  limit: "limit_request:approve",
};

export const INITIATE_PERMISSION: Record<RequestKind, Permission> = {
  freeze: "freeze_request:initiate",
  unfreeze: "unfreeze_request:initiate",
  limit: "limit_request:initiate",
};
