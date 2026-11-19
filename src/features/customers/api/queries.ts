import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { CustomerFilters } from "../model/types";
import { getCustomer, getCustomerTransactionSummary, listCustomers } from "./customersApi";

export const customerKeys = {
  all: ["customers"] as const,
  list: (filters: CustomerFilters) => ["customers", "list", filters] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
  summary: (id: string, range: string, purpose?: string) =>
    ["customers", "transaction-summary", id, range, purpose ?? "all"] as const,
};

export function useCustomers(filters: CustomerFilters) {
  return useApiQuery(customerKeys.list(filters), () => listCustomers(filters), {
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string) {
  return useApiQuery(customerKeys.detail(id), () => getCustomer(id));
}

/** The customer's trend and status split for a period, optionally for one kind of transaction. */
export function useCustomerTransactionSummary(id: string, range: string, purpose?: string) {
  return useApiQuery(
    customerKeys.summary(id, range, purpose),
    () => getCustomerTransactionSummary(id, range, purpose),
    { placeholderData: (previous) => previous },
  );
}
