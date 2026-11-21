import onDark from "@/shared/assets/proxima-wordmark-light.webp";
import onLight from "@/shared/assets/proxima-wordmark.png";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";

/**
 * The Proxima logo with its name, "Proxima microfinance bank". The text is dark for the light theme and white for the dark
 * theme. Only one picture is displayed at a time, so only one is read out.
 */
export function BrandWordmark({
  className,
  onDarkBackground = false,
}: {
  className?: string;
  /** Always show the white text, for a backdrop that is dark in every theme. */
  onDarkBackground?: boolean;
}) {
  if (onDarkBackground) {
    return (
      <img
        src={onDark}
        alt={t("app.name")}
        className={cn("h-9 w-auto max-w-none shrink-0", className)}
      />
    );
  }
  return (
    <>
      <img
        src={onLight}
        alt={t("app.name")}
        className={cn("h-9 w-auto max-w-none shrink-0 dark:hidden", className)}
      />
      <img
        src={onDark}
        alt={t("app.name")}
        className={cn("hidden h-9 w-auto max-w-none shrink-0 dark:block", className)}
      />
    </>
  );
}
