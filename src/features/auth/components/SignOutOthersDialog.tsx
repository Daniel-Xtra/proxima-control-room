import { Devices } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DateText } from "@/shared/components/DateText";
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
import { errorMessage } from "@/shared/lib/errorMessage";
import { revokeOtherSessions, type SessionRow } from "../api/sessionsApi";

const SHOWN = 3;

/** Signs out every other device. Names the devices that will go, and keeps this one signed in. */
export function SignOutOthersDialog({
  open,
  onOpenChange,
  sessions,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: SessionRow[];
  onDone: () => void;
}) {
  const others = sessions.filter((row) => !row.current);
  const signOut = useMutation({
    mutationFn: () => revokeOtherSessions(sessions),
    onSuccess: () => {
      toast.success(t("security.signedOutOthers"));
      onDone();
      onOpenChange(false);
    },
  });
  const busy = signOut.isPending;
  const error = signOut.isError ? errorMessage(signOut.error) : undefined;

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) signOut.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-bg text-danger-text"
            >
              <Devices className="size-5" />
            </span>
            {t("security.signOutOthers.title", { count: others.length })}
          </DialogTitle>
          <DialogDescription>{t("security.signOutOthers.body")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <ul className="m-0 flex list-none flex-col divide-y divide-border-soft rounded-lg border border-border p-0">
            {others.slice(0, SHOWN).map((row) => (
              <li key={row.id} className="px-4 py-2.5">
                <p className="m-0 truncate text-sm font-medium text-ink">
                  {row.device || t("security.signOutOthers.unknown")}
                </p>
                <p className="m-0 text-xs text-muted-text">
                  {row.ip ? `${row.ip} · ` : ""}
                  <DateText iso={row.lastActive} />
                </p>
              </li>
            ))}
            {others.length > SHOWN ? (
              <li className="px-4 py-2.5 text-xs text-muted-text">
                {t("security.signOutOthers.more", { count: others.length - SHOWN })}
              </li>
            ) : null}
          </ul>
          {error ? (
            <p role="alert" className="m-0 text-sm text-danger-text">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={busy || others.length === 0}
            onClick={() => signOut.mutate()}
          >
            {busy ? t("common.working") : t("security.signOutOthers")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
