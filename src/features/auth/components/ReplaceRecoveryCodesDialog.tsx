import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/api/client";
import { stepUp } from "@/shared/api/stepUp";
import { TotpInput } from "@/shared/components/TotpInput";
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
import { regenerateRecoveryCodes } from "../api/authApi";
import { RecoveryCodes } from "./RecoveryCodes";

/**
 * Replaces the admin's recovery codes in one dialog: an authenticator code to confirm, then the new codes, shown once.
 * The dialog cannot be closed from the codes until they are marked as saved.
 */
export function ReplaceRecoveryCodesDialog({
  open,
  onOpenChange,
  remaining,
  onReplaced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many codes are still unused, when known. */
  remaining?: number;
  onReplaced: () => void;
}) {
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  function reset() {
    setCode("");
    setCodes(null);
    setSaved(false);
    setBusy(false);
    setError(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (busy) return;
    // The new codes are not shown again, so keep the dialog open until they are saved.
    if (!next && codes && !saved) return;
    if (!next) reset();
    onOpenChange(next);
  }

  async function replace(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await stepUp(code);
      setCodes(await regenerateRecoveryCodes());
      onReplaced();
    } catch (caught) {
      setCode("");
      setError(caught instanceof ApiError ? caught.message : t("state.error.title"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(event) => codes && event.preventDefault()}
      >
        {codes ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("security.recovery.newTitle")}</DialogTitle>
              <DialogDescription>{t("security.recovery.newBody")}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <RecoveryCodes codes={codes} />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(event) => setSaved(event.target.checked)}
                  className="size-4"
                />
                {t("auth.recovery.saved")}
              </label>
            </DialogBody>
            <DialogFooter>
              <Button disabled={!saved} onClick={() => handleOpenChange(false)}>
                {t("common.done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={replace}>
            <DialogHeader>
              <DialogTitle>{t("security.recovery.replaceTitle")}</DialogTitle>
              <DialogDescription>
                {remaining
                  ? t("security.recovery.replaceBody", { count: remaining })
                  : t("security.recovery.replaceBodyNoCount")}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <TotpInput
                value={code}
                onChange={setCode}
                label={t("security.recovery.enterCode")}
                error={error}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={busy || code.length !== 6}>
                {busy ? t("common.working") : t("security.recovery.replace")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
