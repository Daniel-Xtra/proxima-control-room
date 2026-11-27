import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";

const clock = (hour: number) => `${hour % 12 || 12}:00 ${hour < 12 ? "am" : "pm"}`;

/** Plain words for the cron expressions the backend uses. Anything else is shown as it is. */
export function describeSchedule(cron: string): string {
  if (cron === "* * * * *") return t("jobs.schedule.everyMinute");
  let match = /^\*\/(\d+) \* \* \* \*$/.exec(cron);
  if (match) return t("jobs.schedule.everyMinutes", { count: match[1] ?? "" });
  match = /^(\d+) \* \* \* \*$/.exec(cron);
  if (match) return t("jobs.schedule.hourly", { minute: (match[1] ?? "").padStart(2, "0") });
  match = /^0 \*\/(\d+) \* \* \*$/.exec(cron);
  if (match) return t("jobs.schedule.everyHours", { count: match[1] ?? "" });
  match = /^0 (\d+) \* \* \*$/.exec(cron);
  if (match) return t("jobs.schedule.daily", { time: clock(Number(match[1])) });
  return cron;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return t("jobs.duration.ms", { value: formatCount(ms) });
  if (ms < 60_000) return t("jobs.duration.seconds", { value: (ms / 1000).toFixed(1) });
  return t("jobs.duration.minutes", { value: (ms / 60_000).toFixed(1) });
}
