import { ApiError } from "../api/client";
import { t } from "../i18n/t";

/** What to show for a failed request: the server's own message when it sent one, otherwise a general one. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : t("state.error.title");
}
