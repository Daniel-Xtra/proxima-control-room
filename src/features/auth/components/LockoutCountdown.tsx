import { useEffect, useState } from "react";
import { t } from "@/shared/i18n/t";

/** Counts down to `until` (a time in ms) and calls `onElapsed` once it passes. Shown as 14:32. */
export function LockoutCountdown({
  until,
  onElapsed,
  label = (time) => t("auth.lock.retry", { time }),
}: {
  until: number;
  onElapsed: () => void;
  /** The line shown with the time, such as "Try again in 14:32". */
  label?: (time: string) => string;
}) {
  const [left, setLeft] = useState(() => Math.max(0, until - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, until - Date.now());
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        onElapsed();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [until, onElapsed]);

  const seconds = Math.ceil(left / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <p
      role="timer"
      aria-live="off"
      className="tabular m-0 font-heading text-xl font-medium text-ink"
    >
      {label(time)}
    </p>
  );
}
