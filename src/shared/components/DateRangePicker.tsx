import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { t } from "../i18n/t";
import { cn } from "../lib/cn";
import {
  PRESET_IDS,
  dayNumber,
  daysBetween,
  monthGrid,
  monthLabel,
  monthStart,
  presetRange,
  sameMonth,
  weekdayLabels,
  type PresetId,
} from "../lib/calendar";
import { lagosDay } from "../lib/dateRange";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** The last day that can be picked. Defaults to today. */
  max?: string;
  /** The longest range allowed, in days. Quick choices and days beyond it are left out. */
  maxSpanDays?: number;
  className?: string;
}

/** Two dates in one field. Opens a two-month calendar with quick choices: click a start day, then an end day. */
export function DateRangePicker({ from, to, onChange, max, maxSpanDays, className }: Props) {
  const today = lagosDay();
  const last = max ?? today;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => monthStart(to, -1));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const presets = PRESET_IDS.map((id) => ({ id, ...presetRange(id, last) })).filter(
    (p) => !maxSpanDays || daysBetween(p.from, p.to) < maxSpanDays,
  );

  function toggle(next: boolean) {
    setOpen(next);
    setAnchor(null);
    setHover(null);
    if (next) setView(monthStart(to, -1));
  }
  function pick(id: PresetId) {
    const range = presets.find((p) => p.id === id);
    if (!range) return;
    onChange(range.from, range.to);
    toggle(false);
  }
  function choose(day: string) {
    if (!anchor) {
      setAnchor(day);
      return;
    }
    const [a, b] = day < anchor ? [day, anchor] : [anchor, day];
    onChange(a, b);
    toggle(false);
  }
  function blocked(day: string) {
    if (day > last) return true;
    return Boolean(anchor && maxSpanDays && Math.abs(daysBetween(anchor, day)) >= maxSpanDays);
  }

  // While picking, the range shown is the anchor to wherever the pointer is.
  const edge = anchor ? (hover ?? anchor) : null;
  const shown = anchor && edge ? (anchor < edge ? [anchor, edge] : [edge, anchor]) : [from, to];
  const weekdays = weekdayLabels();

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("range.pick")}
          className={cn(
            "flex h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 text-sm text-ink transition-colors outline-none hover:border-border-control focus-visible:border-primary focus-visible:shadow-none data-[state=open]:border-primary",
            className,
          )}
        >
          <span className="tabular-nums">{from}</span>
          <ArrowRightIcon aria-hidden="true" className="size-3.5 text-muted-text" />
          <span className="tabular-nums">{to}</span>
          <CalendarBlankIcon aria-hidden="true" className="ml-1 size-4 text-muted-text" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex max-h-[calc(100vh-6rem)] flex-col overflow-auto p-0 sm:flex-row">
        <ul className="m-0 flex list-none gap-1 overflow-x-auto border-b border-border p-2 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-r sm:border-b-0">
          {presets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pick(p.id)}
                className="cursor-pointer rounded-md px-3 py-2 text-left text-sm whitespace-nowrap text-ink hover:bg-surface-muted sm:w-36"
              >
                {t(`range.preset.${p.id}`)}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row">
          {[0, 1].map((side) => {
            const month = monthStart(view, side);
            return (
              <div key={side} className={cn("p-3", side === 0 && "max-sm:hidden")}>
                <div className="mb-2 flex h-9 items-center justify-between">
                  <span className={cn("flex", side === 1 && "sm:invisible")}>
                    <NavButton
                      label={t("range.prevYear")}
                      onClick={() => setView(monthStart(view, -12))}
                    >
                      <CaretDoubleLeftIcon aria-hidden="true" className="size-3.5" />
                    </NavButton>
                    <NavButton
                      label={t("range.prevMonth")}
                      onClick={() => setView(monthStart(view, -1))}
                    >
                      <CaretLeftIcon aria-hidden="true" className="size-3.5" />
                    </NavButton>
                  </span>
                  <span className="text-sm font-semibold text-ink">{monthLabel(month)}</span>
                  <span className={cn("flex", side === 0 && "invisible")}>
                    <NavButton
                      label={t("range.nextMonth")}
                      onClick={() => setView(monthStart(view, 1))}
                    >
                      <CaretRightIcon aria-hidden="true" className="size-3.5" />
                    </NavButton>
                    <NavButton
                      label={t("range.nextYear")}
                      onClick={() => setView(monthStart(view, 12))}
                    >
                      <CaretDoubleRightIcon aria-hidden="true" className="size-3.5" />
                    </NavButton>
                  </span>
                </div>
                <div className="grid grid-cols-7 text-center text-sm">
                  {weekdays.map((w, i) => (
                    <span key={i} className="flex h-9 w-10 items-center justify-center font-medium">
                      {w}
                    </span>
                  ))}
                  {monthGrid(month).map((day) => {
                    const inMonth = sameMonth(day, month);
                    const off = blocked(day);
                    const isEnd = day === shown[0] || day === shown[1];
                    const inside = day > shown[0] && day < shown[1];
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={off || !inMonth}
                        aria-label={day}
                        aria-pressed={isEnd}
                        tabIndex={inMonth ? 0 : -1}
                        onClick={() => choose(day)}
                        onMouseEnter={() => anchor && setHover(day)}
                        className={cn(
                          "relative flex h-9 w-10 items-center justify-center text-sm tabular-nums",
                          !inMonth && "invisible",
                          inMonth && off && "cursor-not-allowed bg-surface-muted text-text-faint",
                          inMonth && !off && "cursor-pointer text-ink hover:bg-blue-tint-strong",
                          inside && !off && "bg-blue-tint-strong",
                          isEnd && inMonth && "rounded-md bg-primary text-on-ink hover:bg-primary",
                          day === today && !isEnd && "font-semibold text-blue-strong",
                        )}
                      >
                        {dayNumber(day)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-text hover:bg-surface-muted hover:text-ink"
    >
      {children}
    </button>
  );
}
