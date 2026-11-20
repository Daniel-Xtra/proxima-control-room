import { ArrowsClockwise, CheckCircle, EnvelopeSimple, UserMinus } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/client";
import { stepUp } from "@/shared/api/stepUp";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TotpInput } from "@/shared/components/TotpInput";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/shared/components/ui/Dialog";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";
import { resendInvitation, revokeInvitation, type StaffMember } from "../api/accessApi";

export type InvitationMode = "resend" | "revoke";

interface Props {
  mode: InvitationMode | null;
  member: StaffMember | null;
  roleName: string;
  onClose: () => void;
  /** Called after the change went through, to refresh the staff list. */
  onDone: () => void | Promise<unknown>;
}

const COPY = {
  resend: {
    icon: ArrowsClockwise,
    title: "staff.invite.resend",
    lead: "staff.invite.dialog.resend.lead",
    points: [
      "staff.invite.dialog.resend.p1",
      "staff.invite.dialog.resend.p2",
      "staff.invite.dialog.resend.p3",
    ],
    done: "staff.invite.resend.done",
  },
  revoke: {
    icon: UserMinus,
    title: "staff.invite.revoke",
    lead: "staff.invite.dialog.revoke.lead",
    points: [
      "staff.invite.dialog.revoke.p1",
      "staff.invite.dialog.revoke.p2",
      "staff.invite.dialog.revoke.p3",
    ],
    done: "staff.invite.revoke.done",
  },
} as const;

/** Resends or revokes a staff invitation: who it affects, what happens, and the authenticator code. */
export function InvitationDialog({ mode, member, roleName, onClose, onDone }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const copy = mode ? COPY[mode] : null;
  const Icon = copy?.icon ?? EnvelopeSimple;
  const revoke = mode === "revoke";

  function close() {
    if (busy) return;
    setCode("");
    setError(undefined);
    onClose();
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!member || !copy || code.length !== 6 || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await stepUp(code);
      if (mode === "resend") await resendInvitation(member.id);
      else await revokeInvitation(member.id);
      toast.success(t(copy.done));
      await onDone();
      setCode("");
      onClose();
    } catch (caught) {
      setCode("");
      setError(caught instanceof ApiError ? caught.message : t("state.error.title"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-5 px-6 pt-7 pb-2">
            <div className="flex flex-col items-center gap-3 text-center">
              <span
                aria-hidden="true"
                className={
                  revoke
                    ? "flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger-text"
                    : "flex size-12 items-center justify-center rounded-full bg-info-bg text-info-text"
                }
              >
                <Icon size={24} weight="duotone" />
              </span>
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-lg">{copy ? t(copy.title) : ""}</DialogTitle>
                <DialogDescription className="text-sm text-muted-text">
                  {copy ? t(copy.lead) : ""}
                </DialogDescription>
              </div>
            </div>

            {member ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink ring-1 ring-border"
                >
                  {initials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-medium text-ink">{member.name}</p>
                  <p className="m-0 truncate text-xs text-muted-text">{member.email}</p>
                  <p className="m-0 mt-0.5 truncate text-xs text-muted-text">{roleName}</p>
                </div>
                <StatusBadge
                  tone={member.invitation === "pending" ? "info" : "warning"}
                  label={
                    member.invitation === "pending" ? t("staff.invited") : t("staff.inviteExpired")
                  }
                />
              </div>
            ) : null}

            {copy ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {copy.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-body">
                    <CheckCircle
                      size={16}
                      weight="fill"
                      aria-hidden="true"
                      className={revoke ? "mt-0.5 text-danger-text" : "mt-0.5 text-success-text"}
                    />
                    <span>{t(point, { email: member?.email ?? "" })}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <TotpInput
              value={code}
              onChange={setCode}
              error={error}
              label={t("staff.invite.dialog.code")}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant={revoke ? "destructive" : "primary"}
              disabled={busy || code.length !== 6}
              aria-busy={busy}
            >
              {busy ? t("common.working") : copy ? t(copy.title) : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
