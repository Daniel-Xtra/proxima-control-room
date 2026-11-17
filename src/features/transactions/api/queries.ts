import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { TransactionFilters } from "../model/types";
import { getTransactionDetail, listTransactions } from "./transactionsApi";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", "list", filters] as const,
  detail: (reference: string) => ["transactions", "detail", reference] as const,
};

export function useTransactions(filters: TransactionFilters) {
  return useApiQuery(transactionKeys.list(filters), () => listTransactions(filters), {
    placeholderData: (previous) => previous,
  });
}

export function useTransactionDetail(reference: string | null) {
  return useApiQuery(
    transactionKeys.detail(reference ?? ""),
    () => getTransactionDetail(reference ?? ""),
    { enabled: reference !== null },
  );
}
