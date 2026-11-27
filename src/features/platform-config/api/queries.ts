import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getConfig, listTurnedOffFees } from "./configApi";

export const configKeys = { all: ["platform-config"] as const };

export const usePlatformConfig = () => useApiQuery(configKeys.all, getConfig);

export const useTurnedOffFees = () =>
  useApiQuery([...configKeys.all, "turned-off-fees"], listTurnedOffFees);
