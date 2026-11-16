import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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

  return (
    <Dialog open={warning} onOpenChange={(open) => !open && setWarning(false)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("auth.idle.title")}</DialogTitle>
          <DialogDescription>{t("auth.idle.description", { seconds })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="m-0 text-sm text-body">{t("auth.idle.body")}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={signOut}>
            {t("shell.signOut")}
          </Button>
          <Button onClick={() => setWarning(false)}>{t("auth.idle.stay")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
