import { getAuditActor, recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { emitDomainEvent } from "@/shared/api/domainEvents";
import { FIXTURE_CUSTOMERS, daysAgo } from "@/shared/api/mockFixtures";
import type { AccountRequest, LimitDiff, RequestFilters, RequestKind } from "../model/types";

const STAFF = ["Tolu Adebayo", "Ife Johnson", "Amaka Eze"];
const REASONS: Record<RequestKind, string[]> = {
  freeze: ["Suspected account takeover", "Court order received", "Multiple chargeback complaints"],
  unfreeze: ["Customer verified identity in branch", "Investigation closed, no case found"],
  limit: [
    "Customer completed BVN upgrade",
    "Business owner needs higher daily cap",
    "Rent payment due",
  ],
};

let store: AccountRequest[] | null = null;

function build(): AccountRequest[] {
  const kinds: RequestKind[] = ["freeze", "limit", "unfreeze", "limit", "freeze", "limit"];
  return Array.from({ length: 18 }, (_, index) => {
    const customer = FIXTURE_CUSTOMERS[(index * 3) % FIXTURE_CUSTOMERS.length]!;
    const kind = kinds[index % kinds.length]!;
    const status = index < 8 ? "pending" : index % 3 === 0 ? "rejected" : "approved";
    const limits: LimitDiff | undefined =
      kind === "limit"
        ? {
            currentDailyKobo: 5_000_000,
            requestedDailyKobo: index % 2 ? 50_000_000 : 20_000_000,
            currentPerTransactionKobo: 2_500_000,
            requestedPerTransactionKobo: index % 2 ? 25_000_000 : 10_000_000,
          }
        : undefined;
    const reasons = REASONS[kind];
    return {
      id: `00000000-0000-4000-8000-0002${index.toString(16).padStart(8, "0")}`,
      kind,
      customerId: customer.id,
      customerName: customer.name,
      requestedBy: STAFF[index % STAFF.length]!,
      reason: reasons[index % reasons.length]!,
      staffComment:
        index % 2 ? "Ticket verified with caller." : "Customer called the support line.",
      status,
      createdAt: daysAgo(index % 6, 9 + (index % 8)),
      ...(status !== "pending"
        ? {
            decidedBy: "Chuka Obi",
            decidedAt: daysAgo(index % 6, 15),
            adminComment: status === "approved" ? "Documents checked." : "Insufficient evidence.",
          }
        : {}),
      limits,
    };
  });
}

function all(): AccountRequest[] {
  store ??= build();
  return store;
}

export function listRequests(filters: RequestFilters) {
  return simulate(() =>
    all()
      .filter((r) => !filters.kind || r.kind === filters.kind)
      .filter((r) => filters.status === "all" || r.status === filters.status)
      .filter((r) => !filters.customerId || r.customerId === filters.customerId)
      .filter((r) => !filters.requestedBy || r.requestedBy === filters.requestedBy)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export function countPending() {
  return simulate(() => all().filter((r) => r.status === "pending").length, 150);
}

export interface NewRequest {
  kind: RequestKind;
  customerId: string;
  customerName: string;
  reason: string;
  staffComment: string;
  limits?: LimitDiff;
}

export function createRequest(input: NewRequest) {
  return simulate(() => {
    const request: AccountRequest = {
      ...input,
      id: crypto.randomUUID(),
      requestedBy: getAuditActor(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    all().unshift(request);
    recordAudit({
      action: `request.${input.kind}.initiate`,
      target: input.customerName,
      reason: input.reason,
    });
    return request;
  });
}

export function decideRequest(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}) {
  return simulate(() => {
    const request = all().find((r) => r.id === input.id);
    if (!request) throw new ApiError(404, "Request not found.");
    if (request.status !== "pending") {
      throw new ApiError(409, "This request has already been decided.");
    }
    const actor = getAuditActor();
    if (request.requestedBy === actor) {
      throw new ApiError(403, "You cannot decide a request you raised.");
    }
    request.status = input.decision;
    request.decidedBy = actor;
    request.decidedAt = new Date().toISOString();
    request.adminComment = input.comment;
    recordAudit({
      action: `request.${request.kind}.${input.decision}`,
      target: request.customerName,
      reason: input.comment,
      before: "pending",
      after: input.decision,
    });
    if (input.decision === "approved") {
      if (request.kind === "limit" && request.limits) {
        emitDomainEvent({
          type: "limits.changed",
          customerId: request.customerId,
          dailyLimitKobo: request.limits.requestedDailyKobo,
          perTransactionLimitKobo: request.limits.requestedPerTransactionKobo,
        });
      } else {
        emitDomainEvent({
          type: request.kind === "freeze" ? "account.frozen" : "account.unfrozen",
          customerId: request.customerId,
          by: actor,
          reason: request.reason,
        });
      }
    }
    return request;
  }, 500);
}
