import { ArrowRight } from "@phosphor-icons/react";
import { createElement } from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Switch } from "@/shared/components/ui/Switch";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import type { BillType } from "../model/billServices";
import { billTypeIcon } from "../model/billTypeIcon";

interface Props {
  /** The bill type with all its billers, so the count is of the whole type. */
  type: BillType;
  /** Billers a search found, when it matched them rather than the bill type's own name. */
  matches: string[];
  editable: boolean;
  onOpen: () => void;
  onChangeType: (enabled: boolean) => void;
}

/** One bill type: how much of it is on, its own switch, and the way into its billers. */
export function BillTypeTile({ type, matches, editable, onOpen, onChangeType }: Props) {
  const on = type.billers.filter((biller) => biller.enabled).length;
  const total = type.billers.length;
  return (
    <div className="relative flex h-full flex-col gap-3 rounded-lg border border-border-soft p-4 transition-colors hover:border-border-control">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-md",
            type.enabled ? "bg-info-bg text-primary" : "bg-surface-muted text-muted-text",
          )}
        >
          {createElement(billTypeIcon(type.name), { "aria-hidden": true, className: "size-5" })}
        </span>
        {/* Above the button below, which is stretched over the whole tile. */}
        <Switch
          className="relative z-10"
          checked={type.enabled}
          disabled={!editable}
          aria-label={t("config.bills.toggleNamed", { name: type.name })}
          onCheckedChange={onChangeType}
        />
      </div>
      <div>
        <h3 className="m-0 text-sm font-medium">{type.name}</h3>
        <p className="m-0 text-xs text-muted-text">
          {t("config.bills.billerCount", { on, total })}
        </p>
        {matches.length > 0 ? (
          <p className="m-0 mt-1 line-clamp-2 text-xs text-ink">
            {t("config.bills.matches", { names: matches.join(", ") })}
          </p>
        ) : null}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t("config.bills.viewNamed", { name: type.name })}
          onClick={onOpen}
          className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-medium text-ink after:absolute after:inset-0 after:rounded-lg"
        >
          {t("config.bills.view")}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </button>
        {!type.enabled ? (
          <StatusBadge tone="danger" label={t("config.bills.off")} />
        ) : on < total ? (
          <StatusBadge tone="warning" label={t("config.bills.partly")} />
        ) : null}
        {!type.listed ? <StatusBadge tone="neutral" label={t("config.bills.notListed")} /> : null}
      </div>
    </div>
  );
}
