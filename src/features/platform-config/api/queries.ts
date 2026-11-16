import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getConfig } from "./configApi";

export const configKeys = { all: ["platform-config"] as const };

export const usePlatformConfig = () => useApiQuery(configKeys.all, getConfig);
