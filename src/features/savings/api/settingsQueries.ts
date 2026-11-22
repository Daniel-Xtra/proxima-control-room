import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getSavingsSettings } from "./settingsApi";

export const savingsSettingsKeys = { all: ["savings-settings"] as const };

export const useSavingsSettings = () => useApiQuery(savingsSettingsKeys.all, getSavingsSettings);
