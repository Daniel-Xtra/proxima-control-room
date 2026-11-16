/** Anything scheduled in the console may be set at most this many days ahead. */
export const MAX_SCHEDULE_DAYS = 30;

/** The window a scheduled time may fall in. */
export function scheduleWindow(now: Date) {
  return {
    earliest: now,
    latest: new Date(now.getTime() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000),
  };
}

/** A scheduled time must be in the future and no more than 30 days away. */
export function isScheduleAllowed(date: Date, now: Date): boolean {
  return date > now && date <= scheduleWindow(now).latest;
}

/** `datetime-local` inputs want local time as YYYY-MM-DDTHH:mm. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
