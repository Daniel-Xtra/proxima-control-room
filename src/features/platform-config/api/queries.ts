import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getConfig, listBillServices, listTurnedOffFees } from "./configApi";

export const configKeys = { all: ["platform-config"] as const };

export const usePlatformConfig = () => useApiQuery(configKeys.all, getConfig);

export const useBillServices = () =>
  useApiQuery([...configKeys.all, "bill-services"], listBillServices);

export const useTurnedOffFees = () =>
  useApiQuery([...configKeys.all, "turned-off-fees"], listTurnedOffFees);
