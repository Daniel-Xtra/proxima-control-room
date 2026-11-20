import { useApiQuery } from "@/shared/hooks/useApiQuery";
import {
  getOverviewSavings,
  getOverviewStatus,
  getOverviewSummary,
  getOverviewTrend,
} from "./overviewApi";

/** The dashboard refreshes each minute, which is as often as the server recalculates it. */
const REFRESH = { refetchInterval: 60_000 };

export const overviewKeys = {
  summary: (range: string) => ["overview", "summary", range] as const,
  trend: (range: string, purpose?: string) =>
    ["overview", "trend", range, purpose ?? "all"] as const,
  status: (range: string) => ["overview", "status", range] as const,
  savings: ["overview", "savings"] as const,
};

export const useOverviewSummary = (range: string) =>
  useApiQuery(overviewKeys.summary(range), () => getOverviewSummary(range), {
    ...REFRESH,
    placeholderData: (previous) => previous,
  });

export const useOverviewTrend = (range: string, purpose?: string) =>
  useApiQuery(overviewKeys.trend(range, purpose), () => getOverviewTrend(range, purpose), {
    ...REFRESH,
    placeholderData: (previous) => previous,
  });

export const useOverviewStatus = (range: string) =>
  useApiQuery(overviewKeys.status(range), () => getOverviewStatus(range), {
    ...REFRESH,
    placeholderData: (previous) => previous,
  });

export const useOverviewSavings = () =>
  useApiQuery(overviewKeys.savings, getOverviewSavings, REFRESH);
