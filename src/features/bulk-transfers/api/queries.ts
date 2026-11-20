import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import type { BatchFilters, BatchStatus, PayeeDraft } from "../model/types";
import {
  estimateBulkFee,
  getBatch,
  getBatchItems,
  type ItemFilters,
  getSourceBalances,
  listBatches,
  listPlatformWallets,
} from "./bulkApi";

export const bulkKeys = {
  all: ["bulk-transfers"] as const,
  list: (filters: BatchFilters) => ["bulk-transfers", "list", filters] as const,
  detail: (id: string) => ["bulk-transfers", "detail", id] as const,
  balances: ["bulk-transfers", "balances"] as const,
  wallets: ["bulk-transfers", "wallets"] as const,
  fee: (amounts: number[]) => ["bulk-transfers", "fee", amounts.join(",")] as const,
};

/** Refreshed every minute, since other payouts change the balance. */
export const useSourceBalances = (enabled = true) =>
  useApiQuery(bulkKeys.balances, getSourceBalances, { refetchInterval: 60_000, enabled });

export const useBatches = (filters: BatchFilters) =>
  useApiQuery(bulkKeys.list(filters), () => listBatches(filters));

/** A batch in one of these states is still moving: the processor picks it up within a minute and sends it payee by payee. */
export const isBatchActive = (status: BatchStatus | undefined) =>
  status === "approved" || status === "processing" || status === "reconciling";

const LIVE_MS = 5_000;

/** Refreshes itself while the batch is being sent, so an approved batch does not sit on "Approved" until reload. */
export const useBatch = (id: string) =>
  useApiQuery(bulkKeys.detail(id), () => getBatch(id), {
    refetchInterval: (query) => (isBatchActive(query.state.data?.status) ? LIVE_MS : false),
  });

/**
 * The fee for the payees drafted so far, from the fee settings. `known` is false until it has loaded, and `error` says why
 * when it could not (for example "Too many requests"). The amounts are settled for half a second before asking, and the answer
 * is kept for five minutes, so editing the list does not call the server once per change.
 */
export function useBulkFee(payees: PayeeDraft[]) {
  const wanted = payees
    .flatMap((p) => (p.amountKobo && p.amountKobo > 0 ? [p.amountKobo] : []))
    .join(",");
  const settled = useDebouncedValue(wanted);
  const amounts = settled === "" ? [] : settled.split(",").map(Number);
  const query = useApiQuery(bulkKeys.fee(amounts), () => estimateBulkFee(amounts), {
    enabled: amounts.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const none = wanted === "";
  return {
    feeKobo: none ? 0 : (query.data ?? 0),
    known: none || (settled === wanted && Number.isFinite(query.data)),
    error: none ? null : query.error,
    retry: () => void query.refetch(),
  };
}

/** One page of a batch's payees. Shares the batch's key, so a decision or retry refreshes it too. */
export const useBatchItems = (id: string, filters: ItemFilters, live = false) =>
  useApiQuery(
    [...bulkKeys.detail(id), "items", filters] as const,
    () => getBatchItems(id, filters),
    {
      refetchInterval: live ? LIVE_MS : false,
    },
  );

export const usePlatformWallets = () => useApiQuery(bulkKeys.wallets, listPlatformWallets);

/** The name of a pay-from wallet, or its id while the list loads or when it is not listed. */
export function useSourceName(id: string | null): string {
  const sources = useSourceBalances(id !== null);
  return sources.data?.find((source) => source.id === id)?.name ?? id ?? "";
}
