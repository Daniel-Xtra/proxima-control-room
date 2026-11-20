import { lagosDay } from "./dateRange";

/** Calendar helpers on YYYY-MM-DD strings. Dates are plain calendar days, so everything runs in UTC to dodge time zones. */
const toDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toDay = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (day: string, n: number) => {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + n);
  return toDay(date);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);

/** The first day of the month that is `offset` months from the month of `day`. */
export function monthStart(day: string, offset = 0) {
  const date = toDate(day);
  return toDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1)));
}

/** The 42 days (six Sunday-first weeks) that fill the month grid of `day`. */
export function monthGrid(day: string): string[] {
  const first = toDate(monthStart(day));
  const lead = first.getUTCDay();
  return Array.from({ length: 42 }, (_, i) => addDays(toDay(first), i - lead));
}

export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);

export const monthLabel = (day: string) =>
  new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    toDate(day),
  );

export const dayNumber = (day: string) => Number(day.slice(8));

/** Sunday-first weekday initials, for the grid header. */
export const weekdayLabels = () =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(2023, 0, 1 + i)))
      .slice(0, 2),
  );

export type PresetId =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "allTime";

export const PRESET_IDS: PresetId[] = [
  "today",
  "yesterday",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "lastYear",
  "allTime",
];

/** The days a quick choice stands for, ending no later than today. */
export function presetRange(id: PresetId, today = lagosDay()): { from: string; to: string } {
  const weekStart = addDays(today, -toDate(today).getUTCDay());
  const month = monthStart(today);
  const year = `${today.slice(0, 4)}-01-01`;
  switch (id) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "thisWeek":
      return { from: weekStart, to: today };
    case "lastWeek":
      return { from: addDays(weekStart, -7), to: addDays(weekStart, -1) };
    case "thisMonth":
      return { from: month, to: today };
    case "lastMonth":
      return { from: monthStart(today, -1), to: addDays(month, -1) };
    case "thisYear":
      return { from: year, to: today };
    case "lastYear":
      return { from: `${Number(today.slice(0, 4)) - 1}-01-01`, to: addDays(year, -1) };
    case "allTime":
      return { from: "2020-01-01", to: today };
  }
}
