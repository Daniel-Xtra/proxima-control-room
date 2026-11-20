import { isNoResponse, type ApiError } from "@/shared/api/client";
import { dayLabel } from "@/shared/lib/dayLabel";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  Bucket,
  BillBucket,
  OverviewSavings,
  OverviewStatus,
  OverviewSummary,
  OverviewTrend,
} from "./overviewApi";

/**
 * What each section shows when the server does not answer: the same layout as with data, with every figure at zero. A section
 * that failed for another reason (no permission, a server error) still shows its error, since zeros there would be a guess.
 */

const NONE: Bucket = { count: 0, amountKobo: 0 };
const NO_BILLS: BillBucket = { ...NONE, successes: 0, failures: 0, pending: 0 };

export const ZERO_SUMMARY: OverviewSummary = {
  deltas: { transactions: 0, value: 0, fixedDeposits: 0, targetSavings: 0 },
  transactions: { total: 0, valueKobo: 0 },
  fixedDeposits: { total: 0 },
  targetSavings: { total: 0 },
  transfers: { total: 0, successful: 0, failed: 0, pending: 0 },
  bills: { total: 0, airtime: 0, data: 0, failures: 0 },
  signUps: { total: 0, male: 0, female: 0 },
};

export const ZERO_STATUS: OverviewStatus = {
  transfers: { total: NONE, successful: NONE, failed: NONE, pending: NONE },
  bills: { airtime: NO_BILLS, data: NO_BILLS, billers: [] },
};

export const ZERO_SAVINGS: OverviewSavings = {
  fixedTotalKobo: 0,
  fixedCount: 0,
  targetTotalKobo: 0,
  targetCount: 0,
};

/** A flat line over the same number of days the period would have, so the chart keeps its shape and its axis. */
export function zeroTrend(range: string): OverviewTrend {
  const days = Math.max(Number.parseInt(range, 10) || 30, 2);
  const labels = Array.from({ length: days }, (_, i) =>
    dayLabel(new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10)),
  );
  const zeros = labels.map(() => 0);
  return { labels, valueKobo: zeros, volume: zeros };
}

type QueryLike<T> = Pick<
  UseQueryResult<T, ApiError>,
  "data" | "isLoading" | "isError" | "error" | "refetch"
>;

/**
 * Answers with the zeros when the server gave no response, and says so, so the section can mention it. Anything else
 * passes through unchanged.
 */
export function orZeros<T>(
  query: QueryLike<T>,
  zero: T,
): { query: QueryLike<T>; offline: boolean } {
  const offline = query.isError && isNoResponse(query.error);
  return {
    offline,
    query: offline
      ? { ...query, data: zero, isLoading: false, isError: false, error: null }
      : query,
  };
}
