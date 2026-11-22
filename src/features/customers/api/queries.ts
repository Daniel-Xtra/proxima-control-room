import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { CustomerFilters, UpgradeRequestFilters } from "../model/types";
import { getCustomer, getCustomerTransactionSummary, listCustomers } from "./customersApi";
import { countAwaitingUpgrades, listUpgradeRequests } from "./upgradeRequestsApi";

export const customerKeys = {
  all: ["customers"] as const,
  list: (filters: CustomerFilters) => ["customers", "list", filters] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
  upgrades: (filters: UpgradeRequestFilters) => ["customers", "upgrade-requests", filters] as const,
  awaiting: ["customers", "upgrade-requests", "awaiting"] as const,
  summary: (id: string, range: string, purpose?: string) =>
    ["customers", "transaction-summary", id, range, purpose ?? "all"] as const,
};

export function useCustomers(filters: CustomerFilters) {
  return useApiQuery(customerKeys.list(filters), () => listCustomers(filters), {
    keepPreviousPage: true,
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

export function useUpgradeRequests(filters: UpgradeRequestFilters) {
  return useApiQuery(customerKeys.upgrades(filters), () => listUpgradeRequests(filters), {
    keepPreviousPage: true,
  });
}

/** Customers waiting for a decision. Refreshed each minute so the tab badge stays honest. */
export function useAwaitingUpgradeCount(enabled = true) {
  return useApiQuery(customerKeys.awaiting, countAwaitingUpgrades, {
    enabled,
    refetchInterval: 60_000,
  });
}
