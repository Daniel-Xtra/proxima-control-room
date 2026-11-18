import { useApiQuery } from "@/shared/hooks/useApiQuery";
import {
  listFixedDeposits,
  listTargetSavings,
  previewBreakage,
  type SavingsFilters,
} from "./savingsApi";

export const savingsKeys = {
  all: ["savings"] as const,
  fixed: (customerId?: string, filters?: SavingsFilters) =>
    ["savings", "fixed", customerId ?? "all", filters] as const,
  target: (customerId?: string, filters?: SavingsFilters) =>
    ["savings", "target", customerId ?? "all", filters] as const,
  breakage: (id: string) => ["savings", "breakage", id] as const,
};

export const useFixedDeposits = (customerId?: string, filters?: SavingsFilters) =>
  useApiQuery(savingsKeys.fixed(customerId, filters), () => listFixedDeposits(customerId, filters));

export const useTargetSavings = (customerId?: string, filters?: SavingsFilters) =>
  useApiQuery(savingsKeys.target(customerId, filters), () =>
    listTargetSavings(customerId, filters),
  );

export const useBreakagePreview = (id: string | null) =>
  useApiQuery(savingsKeys.breakage(id ?? ""), () => previewBreakage(id ?? ""), {
    enabled: id !== null,
  });
