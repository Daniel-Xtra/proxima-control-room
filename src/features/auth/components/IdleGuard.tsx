import { Timer } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/shared/components/ui/Dialog";
import { t } from "@/shared/i18n/t";
import { useSession } from "../hooks/useSession";

const IDLE_MS = 14 * 60 * 1000;
const GRACE_SECONDS = 60;

/**
 * Warns before the idle timeout, then signs out when the countdown ends. Time is measured against
 * the last activity, not by counting ticks, so a throttled background tab still signs out on time.
 */
export function IdleGuard() {
  const { signOut } = useSession();
  const lastActivity = useRef(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const warning = seconds !== null;

  useEffect(() => {
    lastActivity.current = Date.now();
    function check() {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS + GRACE_SECONDS * 1000) {
        signOut();
      } else if (idle >= IDLE_MS) {
        setSeconds(Math.ceil((IDLE_MS + GRACE_SECONDS * 1000 - idle) / 1000));
      }
    }
    function onActivity() {
      // Once the warning shows, only "Stay signed in" keeps the session.
      if (Date.now() - lastActivity.current < IDLE_MS) lastActivity.current = Date.now();
    }
    const id = window.setInterval(check, 1000);
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, true));
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      events.forEach((name) => window.removeEventListener(name, onActivity, true));
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [signOut]);

  // A background tab may run the interval rarely, so also wake exactly when the countdown ends.
  useEffect(() => {
    if (!warning) return;
    const left = IDLE_MS + GRACE_SECONDS * 1000 - (Date.now() - lastActivity.current);
    const id = window.setTimeout(signOut, Math.max(left, 0));
    return () => window.clearTimeout(id);
  }, [warning, signOut]);

  function stay() {
    lastActivity.current = Date.now();
    setSeconds(null);
  }

  const left = Math.max(seconds ?? 0, 0);
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <Dialog open={warning}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-warning-bg text-warning-text"
          >
            <Timer size={28} weight="duotone" />
          </span>
          <DialogTitle className="mt-4 text-lg">{t("auth.idle.title")}</DialogTitle>
          <output
            className="tabular mt-3 block text-4xl font-semibold text-ink"
            aria-label={t("auth.idle.countdownLabel", { seconds: left })}
          >
            {clock}
          </output>
          <div
            aria-hidden="true"
            className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className="h-full rounded-full bg-warning-solid transition-[width] duration-1000 ease-linear"
              style={{ width: `${(left / GRACE_SECONDS) * 100}%` }}
            />
          </div>
          <DialogDescription className="mt-4 text-sm text-body">
            {t("auth.idle.message")}
          </DialogDescription>
        </div>
        <DialogFooter className="gap-2 p-4 sm:gap-3 sm:p-4 [&_button]:h-11 [&_button]:p-0">
          <Button variant="outline" onClick={signOut}>
            {t("shell.signOut")}
          </Button>
          <Button onClick={stay}>{t("auth.idle.stay")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
