/**
 * A custom date range lives inside the `range` filter value, as `custom:YYYY-MM-DD_YYYY-MM-DD`, so it travels in the page URL
 * and through every query that already takes a range. Days are Lagos days, matching how dates are shown.
 */
const PREFIX = "custom:";

/** The option value that stands for "pick my own dates" in a range dropdown. */
export const CUSTOM_OPTION = "custom";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A Lagos calendar day as YYYY-MM-DD, `offsetDays` from today. */
export function lagosDay(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(date);
}

export const isCustomRange = (range: string) => range.startsWith(PREFIX);

export const customRange = (from: string, to: string) => `${PREFIX}${from}_${to}`;

/** The two days of a custom range, or null when the value is not one or the days are not in order. */
export function parseCustomRange(range: string): { from: string; to: string } | null {
  if (!isCustomRange(range)) return null;
  const [from, to] = range.slice(PREFIX.length).split("_");
  if (!from || !to || !DAY.test(from) || !DAY.test(to) || from > to) return null;
  return { from, to };
}

/** The range as ISO instants: the start of the first Lagos day to the end of the last (Lagos is UTC+1 all year). */
export function customWindow(range: string): { from: string; to: string } | null {
  const days = parseCustomRange(range);
  if (!days) return null;
  return {
    from: new Date(`${days.from}T00:00:00+01:00`).toISOString(),
    to: new Date(`${days.to}T23:59:59.999+01:00`).toISOString(),
  };
}
