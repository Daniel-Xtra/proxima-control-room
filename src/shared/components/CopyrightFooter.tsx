import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";

const YEAR = new Date().getFullYear();

/** The copyright line shown at the bottom of every screen. */
export function CopyrightFooter({ className }: { className?: string }) {
  return (
    <p className={cn("m-0 text-center text-xs text-muted-text", className)}>
      {t("common.copyright", { year: YEAR })}
    </p>
  );
}
