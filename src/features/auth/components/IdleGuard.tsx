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

/** Warns before the 15 minute idle timeout without discarding form state. */
export function IdleGuard() {
  const { signOut } = useSession();
  const [warning, setWarning] = useState(false);
  const [seconds, setSeconds] = useState(GRACE_SECONDS);
  const timer = useRef<number>(undefined);

  useEffect(() => {
    function arm() {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSeconds(GRACE_SECONDS);
        setWarning(true);
      }, IDLE_MS);
    }
    function onActivity() {
      if (!warning) arm();
    }
    arm();
    const events = ["pointerdown", "keydown"] as const;
    events.forEach((name) => window.addEventListener(name, onActivity));
    return () => {
      window.clearTimeout(timer.current);
      events.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [warning]);

  useEffect(() => {
    if (!warning) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [warning]);

  useEffect(() => {
    if (warning && seconds <= 0) signOut();
  }, [warning, seconds, signOut]);

  const clock = `${Math.floor(Math.max(seconds, 0) / 60)}:${String(Math.max(seconds, 0) % 60).padStart(2, "0")}`;

  return (
    <Dialog open={warning} onOpenChange={(open) => !open && setWarning(false)}>
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
            aria-label={t("auth.idle.countdownLabel", { seconds })}
          >
            {clock}
          </output>
          <div
            aria-hidden="true"
            className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className="h-full rounded-full bg-warning-solid transition-[width] duration-1000 ease-linear"
              style={{ width: `${(Math.max(seconds, 0) / GRACE_SECONDS) * 100}%` }}
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
          <Button onClick={() => setWarning(false)}>{t("auth.idle.stay")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
