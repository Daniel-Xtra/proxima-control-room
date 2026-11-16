import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { RequestFilters } from "../model/types";
import { countPending, listRequests } from "./requestsApi";

export const requestKeys = {
  all: ["requests"] as const,
  list: (filters: RequestFilters) => ["requests", "list", filters] as const,
  pending: ["requests", "pending-count"] as const,
};

export function useRequests(filters: RequestFilters) {
  return useApiQuery(requestKeys.list(filters), () => listRequests(filters));
}

export function usePendingRequestCount(enabled = true) {
  return useApiQuery(requestKeys.pending, countPending, {
    enabled,
    refetchInterval: 60_000,
  });
}
