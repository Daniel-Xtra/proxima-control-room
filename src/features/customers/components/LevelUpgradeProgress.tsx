import { ArrowRight, CheckCircle, CircleDashed } from "@phosphor-icons/react";
import { MoneyText } from "@/shared/components/MoneyText";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/t";
import type { TierUpgrade } from "../api/tierUpgradeApi";

/** From the current level to the next, with how much of the checklist is done. */
function Journey({ info, done }: { info: TierUpgrade; done: number }) {
  const total = info.requirements.length;
  const summary = t("upgrade.progress", { done, total });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="m-0 flex items-center gap-2 text-sm">
          <span className="rounded-full border border-border bg-surface-muted px-3 py-1 font-medium text-ink">
            {t("upgrade.levelNow", { level: info.currentLevel })}
          </span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-text" />
          <span className="rounded-full border border-dashed border-border-strong px-3 py-1 text-muted-text">
            {t("upgrade.level", { level: info.targetLevel })}
          </span>
        </p>
        <p className="m-0 text-xs text-muted-text">{summary}</p>
      </div>
      {/* One segment per requirement. The words above say the same thing, so this is decoration. */}
      <div aria-hidden="true" className="mt-3 flex gap-1">
        {info.requirements.map((item, index) => (
          <span
            key={item.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index < done ? "bg-primary" : "bg-neutral-bg",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Checklist({ items }: { items: TierUpgrade["requirements"] }) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 @lg:grid-cols-2 @4xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.met ? CheckCircle : CircleDashed;
        return (
          <li
            key={item.key}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5",
              item.met
                ? "border-border-soft bg-surface-muted"
                : "border-dashed border-border-strong",
            )}
          >
            <Icon
              aria-hidden="true"
              weight={item.met ? "fill" : "regular"}
              className={cn("size-5 shrink-0", item.met ? "text-success-text" : "text-muted-text")}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">
                {t(`upgrade.requirement.${item.key}`)}
              </span>
              <span
                className={cn("block text-xs", item.met ? "text-success-text" : "text-muted-text")}
              >
                {item.met ? t("upgrade.met") : t("upgrade.notMet")}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** What the customer may send now, where known, beside what the next level allows. */
function LimitsTable({ info }: { info: TierUpgrade }) {
  const now = info.currentLimits;
  const rows = [
    { label: t("upgrade.limit.perTransaction"), key: "perTransactionKobo" },
    { label: t("upgrade.limit.daily"), key: "dailyKobo" },
  ] as const;

  return (
    <div className="overflow-x-auto rounded-lg border border-border-soft">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-muted text-xs text-muted-text">
            <th scope="col" className="px-3 py-2 text-left font-medium">
              {t("upgrade.limits")}
            </th>
            {now ? (
              <th scope="col" className="px-3 py-2 text-right font-medium">
                {t("upgrade.limitsNow")}
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {t("upgrade.limitsAfter")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border-soft">
              <th scope="row" className="px-3 py-2.5 text-left font-normal text-muted-text">
                {row.label}
              </th>
              {now ? (
                <td className="px-3 py-2.5 text-right text-muted-text tabular-nums">
                  <MoneyText kobo={now[row.key]} />
                </td>
              ) : null}
              <td className="px-3 py-2.5 text-right text-ink tabular-nums">
                <MoneyText kobo={info.newLimits[row.key]} className="font-semibold" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The path to the next level: progress, what is approved or missing, and what the limits become. */
export function LevelUpgradeProgress({ info }: { info: TierUpgrade }) {
  const done = info.requirements.filter((item) => item.met).length;

  return (
    <div className="@container flex flex-col gap-4 p-4">
      <Journey info={info} done={done} />
      <Checklist items={info.requirements} />
      <LimitsTable info={info} />
    </div>
  );
}
