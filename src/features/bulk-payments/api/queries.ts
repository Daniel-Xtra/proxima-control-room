import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getBatch, getSourceBalances, listBatches } from "./bulkApi";

export const bulkKeys = {
  all: ["bulk-payments"] as const,
  list: (filters: { search: string; status: string }) =>
    ["bulk-payments", "list", filters] as const,
  detail: (id: string) => ["bulk-payments", "detail", id] as const,
  balances: ["bulk-payments", "balances"] as const,
};

/** Refreshed every minute, since other payouts change the balance. */
export const useSourceBalances = () =>
  useApiQuery(bulkKeys.balances, getSourceBalances, { refetchInterval: 60_000 });

export const useBatches = (filters: { search: string; status: string }) =>
  useApiQuery(bulkKeys.list(filters), () => listBatches(filters));

export const useBatch = (id: string) => useApiQuery(bulkKeys.detail(id), () => getBatch(id));
