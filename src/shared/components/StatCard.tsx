import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Sparkline } from "./Sparkline";

const ICON_TONE = {
  default: "bg-surface-muted text-muted-text",
  info: "bg-info-bg text-info-text",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
} as const;

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: number[];
  icon?: ReactNode;
  /** Colours the icon chip, and the value when it signals a problem. */
  tone?: keyof typeof ICON_TONE;
  accent?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
  tone = "default",
  accent,
}: StatCardProps) {
  return (
    <div className={cn("card p-4", accent && "border-orange-border bg-orange-tint")}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-xs font-medium text-muted-text">{label}</p>
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              ICON_TONE[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "m-0 mt-1 text-2xl font-semibold tracking-tight tabular-nums",
          tone === "danger"
            ? "text-danger-text"
            : tone === "warning"
              ? "text-warning-text"
              : "text-ink",
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        {hint ? <p className="m-0 text-xs text-muted-text">{hint}</p> : <span />}
        {trend ? <Sparkline values={trend} /> : null}
      </div>
    </div>
  );
}
