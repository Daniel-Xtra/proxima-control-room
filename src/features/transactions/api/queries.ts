import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { TransactionFilters } from "../model/types";
import { listTransactions } from "./transactionsApi";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", "list", filters] as const,
};

export function useTransactions(filters: TransactionFilters) {
  return useApiQuery(transactionKeys.list(filters), () => listTransactions(filters), {
    placeholderData: (previous) => previous,
  });
}
