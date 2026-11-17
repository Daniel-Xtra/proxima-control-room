import { ApiError } from "./client";
import { t } from "../i18n/t";

/** For actions the admin API does not offer yet: fails with a clear message instead of faking success. */
export function unavailable(): Promise<never> {
  return Promise.reject(new ApiError(501, t("api.unavailable")));
}
