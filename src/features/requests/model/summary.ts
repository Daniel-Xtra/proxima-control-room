import type { AccountRequest, RequestStatus } from "./types";

/** The ways a request can end, in the order they are listed. */
export const OUTCOMES = ["approved", "rejected", "failed", "cancelled", "expired"] as const;

export interface RequestSummary {
  /** Pending requests this admin may decide, whatever the period. */
  waiting: number;
  oldestWaitingAt: string | null;
  /** One entry per approval type that has something waiting, the busiest first. */
  waitingByType: { sample: AccountRequest; count: number }[];
  /** How the requests that closed inside the period ended. */
  outcomes: Record<(typeof OUTCOMES)[number], number>;
  /** From raised to decided, over the requests someone decided inside the period. Null when there are none. */
  averageDecisionMs: number | null;
}

const isOutcome = (status: RequestStatus): status is (typeof OUTCOMES)[number] =>
  (OUTCOMES as readonly string[]).includes(status);

/** A request that expired has no decision time, so it counts on the day it was raised. */
const closedAt = (request: AccountRequest) => Date.parse(request.decidedAt ?? request.createdAt);

export function summariseRequests(
  pending: AccountRequest[],
  all: AccountRequest[],
  period: { from: number; to: number },
): RequestSummary {
  const byType = new Map<string, { sample: AccountRequest; count: number }>();
  let oldestWaitingAt: string | null = null;
  for (const request of pending) {
    const entry = byType.get(request.type);
    if (entry) entry.count += 1;
    else byType.set(request.type, { sample: request, count: 1 });
    if (!oldestWaitingAt || request.createdAt < oldestWaitingAt)
      oldestWaitingAt = request.createdAt;
  }

  const outcomes = { approved: 0, rejected: 0, failed: 0, cancelled: 0, expired: 0 };
  let decisionMs = 0;
  let decisions = 0;
  for (const request of all) {
    if (!isOutcome(request.status)) continue;
    const closed = closedAt(request);
    if (closed < period.from || closed > period.to) continue;
    outcomes[request.status] += 1;
    // Cancelled and expired requests were never decided by a second person.
    if (request.decidedAt && request.status !== "cancelled" && request.status !== "expired") {
      decisionMs += closed - Date.parse(request.createdAt);
      decisions += 1;
    }
  }

  return {
    waiting: pending.length,
    oldestWaitingAt,
    waitingByType: [...byType.values()].sort((a, b) => b.count - a.count),
    outcomes,
    averageDecisionMs: decisions ? decisionMs / decisions : null,
  };
}

/** A length of time in its two largest units: days and hours, hours and minutes, or minutes. */
export function splitDuration(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  };
}
