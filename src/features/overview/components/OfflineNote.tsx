import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";

/** One line over a section that is showing zeros because the server did not answer. */
export function OfflineNote({ onRetry }: { onRetry: () => void }) {
  return (
    <output className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border-soft bg-surface-muted px-3 py-2 text-xs text-muted-text">
      <span>{t("overview.offline")}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </output>
  );
}
