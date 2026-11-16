import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { listFixedDeposits, listTargetSavings, previewBreakage } from "./savingsApi";

export const savingsKeys = {
  all: ["savings"] as const,
  fixed: (customerId?: string) => ["savings", "fixed", customerId ?? "all"] as const,
  target: (customerId?: string) => ["savings", "target", customerId ?? "all"] as const,
  breakage: (id: string) => ["savings", "breakage", id] as const,
};

export const useFixedDeposits = (customerId?: string) =>
  useApiQuery(savingsKeys.fixed(customerId), () => listFixedDeposits(customerId));

export const useTargetSavings = (customerId?: string) =>
  useApiQuery(savingsKeys.target(customerId), () => listTargetSavings(customerId));

export const useBreakagePreview = (id: string | null) =>
  useApiQuery(savingsKeys.breakage(id ?? ""), () => previewBreakage(id ?? ""), {
    enabled: id !== null,
  });
