import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { SavingsKind } from "../model/types";
import {
  listFixedDeposits,
  listPlanInterest,
  listPlanTransactions,
  listTargetSavings,
  previewBreakage,
  type SavingsFilters,
} from "./savingsApi";

export const savingsKeys = {
  all: ["savings"] as const,
  fixed: (customerId?: string, filters?: SavingsFilters, page = 1, limit = 10) =>
    ["savings", "fixed", customerId ?? "all", filters, page, limit] as const,
  target: (customerId?: string, filters?: SavingsFilters, page = 1, limit = 10) =>
    ["savings", "target", customerId ?? "all", filters, page, limit] as const,
  breakage: (id: string) => ["savings", "breakage", id] as const,
  transactions: (kind: SavingsKind, id: string, page: number, limit: number) =>
    ["savings", "transactions", kind, id, page, limit] as const,
  interest: (kind: SavingsKind, id: string, page: number, limit: number) =>
    ["savings", "interest", kind, id, page, limit] as const,
};

export const useFixedDeposits = (
  customerId: string | undefined,
  filters: SavingsFilters | undefined,
  page: number,
  limit: number,
) =>
  useApiQuery(
    savingsKeys.fixed(customerId, filters, page, limit),
    () => listFixedDeposits(customerId, filters, page, limit),
    { placeholderData: (previous) => previous },
  );

export const useTargetSavings = (
  customerId: string | undefined,
  filters: SavingsFilters | undefined,
  page: number,
  limit: number,
) =>
  useApiQuery(
    savingsKeys.target(customerId, filters, page, limit),
    () => listTargetSavings(customerId, filters, page, limit),
    { placeholderData: (previous) => previous },
  );

export const usePlanTransactions = (kind: SavingsKind, id: string, page: number, limit: number) =>
  useApiQuery(
    savingsKeys.transactions(kind, id, page, limit),
    () => listPlanTransactions(kind, id, page, limit),
    { placeholderData: (previous) => previous },
  );

export const usePlanInterest = (kind: SavingsKind, id: string, page: number, limit: number) =>
  useApiQuery(
    savingsKeys.interest(kind, id, page, limit),
    () => listPlanInterest(kind, id, page, limit),
    { placeholderData: (previous) => previous },
  );

export const useBreakagePreview = (id: string | null) =>
  useApiQuery(savingsKeys.breakage(id ?? ""), () => previewBreakage(id ?? ""), {
    enabled: id !== null,
  });
