import { CheckCircle, Prohibit } from "@phosphor-icons/react";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import type { Biller } from "../model/billServices";

interface Props {
  item: Biller;
  /** True when this tick is not saved yet. */
  changed: boolean;
  /** True when the biller's whole bill type is off. */
  typeOff: boolean;
  editable: boolean;
  onChange: (enabled: boolean) => void;
}

/** One biller as a pill to tick and untick. On has a blue tick and outline; off is grey with a barred circle. */
export function BillerChip({ item, changed, typeOff, editable, onChange }: Props) {
  const Mark = item.enabled ? CheckCircle : Prohibit;
  // Customers cannot pay a biller whose type is off, so its tick fades.
  const payable = item.enabled && !typeOff;
  return (
    <button
      type="button"
      aria-pressed={item.enabled}
      disabled={!editable}
      onClick={() => onChange(!item.enabled)}
      className={cn(
        "flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-dashed py-2 pr-4 pl-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
        "enabled:hover:bg-surface-muted",
        item.enabled
          ? "bg-transparent text-ink"
          : "border-border-control bg-surface-muted text-muted-text",
        payable ? "border-primary/70" : item.enabled && "border-border",
        changed && "border-warning-border bg-warning-bg text-ink",
      )}
    >
      <Mark
        aria-hidden="true"
        weight={item.enabled ? "fill" : "bold"}
        className={cn(
          "size-4.5 shrink-0",
          payable ? "text-primary" : item.enabled && "text-muted-text",
          !item.enabled && "text-danger-text",
        )}
      />
      <span className="min-w-0 wrap-anywhere">{item.name}</span>
      {changed ? (
        <span className="text-xs font-normal text-warning-text">
          {item.enabled ? t("config.bills.willTurnOn") : t("config.bills.willTurnOff")}
        </span>
      ) : null}
      {!item.listed ? (
        <span className="text-xs font-normal text-muted-text">{t("config.bills.notListed")}</span>
      ) : null}
    </button>
  );
}
