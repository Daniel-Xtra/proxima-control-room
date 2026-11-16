import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { CustomerFilters } from "../model/types";
import { getCustomer, listCustomers } from "./customersApi";

export const customerKeys = {
  all: ["customers"] as const,
  list: (filters: CustomerFilters) => ["customers", "list", filters] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};

export function useCustomers(filters: CustomerFilters) {
  return useApiQuery(customerKeys.list(filters), () => listCustomers(filters), {
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string) {
  return useApiQuery(customerKeys.detail(id), () => getCustomer(id));
}
