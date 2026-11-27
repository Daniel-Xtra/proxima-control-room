import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { t } from "../i18n/t";
import { cn } from "../lib/cn";
import { FitText } from "./FitText";

export interface KpiCell {
  label: string;
  value: ReactNode;
  /** A line under the figure: a change, or a few small counts. */
  sub?: ReactNode;
}

// By the strip's own width, not the screen's: with the sidebar open, a wide screen can still leave a narrow strip,
// and a long amount does not wrap.
const COLUMNS = {
  3: "@min-[660px]:grid-cols-3",
  4: "@min-[480px]:grid-cols-2 @min-[960px]:grid-cols-4",
} as const;

/** Headline figures in one card, split by thin dividers. */
export function KpiStrip({ cells, columns }: { cells: KpiCell[]; columns: keyof typeof COLUMNS }) {
  return (
    <section className="card @container overflow-hidden">
      {/* The 1px gaps over a border-coloured background draw the dividers between the cells. */}
      <dl className={cn("m-0 grid gap-px bg-border-soft", COLUMNS[columns])}>
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0 bg-card px-4 py-4 sm:px-5">
            <dt className="text-xs text-muted-text">{cell.label}</dt>
            <dd
              className={cn(
                "m-0 mt-1 font-heading text-2xl font-semibold tracking-tight break-words text-ink tabular-nums",
                cell.sub && "border-b border-border-soft pb-3",
              )}
            >
              <FitText>{cell.value}</FitText>
            </dd>
            {cell.sub ? <div className="mt-3">{cell.sub}</div> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Change against the previous period. The arrow and the wording carry the direction, not just the colour. */
export function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <p
      className={cn(
        "m-0 flex items-center gap-1 text-xs",
        up ? "text-success-text" : "text-danger-text",
      )}
    >
      <Arrow aria-hidden="true" weight="bold" className="size-3 shrink-0" />
      <span>{t(up ? "overview.delta.up" : "overview.delta.down", { pct: Math.abs(pct) })}</span>
    </p>
  );
}

/** Small counts side by side, such as successful and failed. */
export function SubStats({ items }: { items: { label: string; value: string }[] }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-text">
      {items.map((item, index) => (
        <span
          key={item.label}
          className={cn("flex items-center gap-1", index > 0 && "border-l border-border pl-3")}
        >
          <b className="font-semibold text-ink tabular-nums">{item.value}</b>
          {item.label}
        </span>
      ))}
    </p>
  );
}
