import { ShieldSlash } from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/EmptyState";
import { t } from "@/shared/i18n/t";

/** The one permission-denied state used across the app. */
export function PermissionDenied() {
  return (
    <EmptyState
      icon={ShieldSlash}
      title={t("state.forbidden.title")}
      description={t("state.forbidden.description")}
    />
  );
}
