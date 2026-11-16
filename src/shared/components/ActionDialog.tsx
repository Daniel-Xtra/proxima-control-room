import { CheckCircle } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getAuditActor } from "../api/auditStore";
import { ApiError } from "../api/client";
import { t } from "../i18n/t";
import { formatLagos } from "../lib/format";
import { FileUpload, type EvidenceFile } from "./FileUpload";
import { KeyValueList } from "./KeyValueList";
import { TotpInput } from "./TotpInput";
import { Button } from "./ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";

export interface ActionValues {
  ticket: string;
  reason: string;
  evidence: EvidenceFile[];
  code: string;
}

export interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Plain statement of exactly what changes and for whom. */
  impact?: ReactNode;
  /** The confirm button is named after the action, e.g. "Freeze account". */
  confirmLabel: string;
  /** Irreversible or harmful: the confirm button turns destructive. */
  destructive?: boolean;
  /** Extra inputs for this action, shown above the reason. */
  children?: ReactNode;
  /** Disables confirm until the caller's own inputs are valid. */
  blocked?: boolean;
  /** Require a fresh authenticator code (step-up). Defaults to true. */
  requireTotp?: boolean;
  /** The action takes no reason: the field and its row in the result are left out. */
  requireReason?: boolean;
  /** The reason is a comment and may be left empty. */
  reasonOptional?: boolean;
  /** Evidence upload: "optional" (default when a reason is asked for), "required" or "none". */
  evidence?: "none" | "optional" | "required";
  /** The user must type the confirmation word before the action can run. */
  typedConfirmation?: boolean;
  /** Runs the change. The resolved string is the outcome shown in the result and the toast. */
  onConfirm: (values: ActionValues) => Promise<string>;
}

const EMPTY: ActionValues = { ticket: "", reason: "", evidence: [], code: "" };
const MIN_REASON = 5;

/**
 * The one dialog every mutation goes through: ticket reference, reason, evidence,
 * a fresh authenticator code, then a result with the audit record.
 */
export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  impact,
  confirmLabel,
  destructive,
  children,
  blocked,
  requireTotp = true,
  requireReason = true,
  reasonOptional,
  evidence,
  typedConfirmation,
  onConfirm,
}: ActionDialogProps) {
  const [values, setValues] = useState<ActionValues>(EMPTY);
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState<"details" | "totp">("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{ outcome: string; at: string; values: ActionValues }>();

  const evidenceMode = evidence ?? (requireReason ? "optional" : "none");
  const confirmWord = t("action.confirmWord");

  function reset() {
    setValues(EMPTY);
    setTyped("");
    setStep("details");
    setError(undefined);
    setBusy(false);
    setResult(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (busy) return;
    if (!next) reset();
    onOpenChange(next);
  }

  const reasonOk = !requireReason || reasonOptional || values.reason.trim().length >= MIN_REASON;
  const typedOk = !typedConfirmation || typed === confirmWord;
  const evidenceOk = evidenceMode !== "required" || values.evidence.length > 0;
  const detailsValid = !blocked && reasonOk && typedOk && evidenceOk;

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      const outcome = await onConfirm(values);
      toast.success(outcome);
      setResult({ outcome, at: new Date().toISOString(), values });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("state.error.title"));
    } finally {
      setBusy(false);
    }
  }

  function advance() {
    if (requireTotp && step === "details") setStep("totp");
    else void submit();
  }

  const canAdvance = !busy && (step === "details" ? detailsValid : values.code.length === 6);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {result ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <CheckCircle
                  size={18}
                  weight="fill"
                  aria-hidden="true"
                  className="text-success-text"
                />
                <DialogTitle>{t("action.done.title")}</DialogTitle>
              </div>
              <DialogDescription>{title}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <p className="m-0 text-sm text-ink">{result.outcome}</p>
              <div className="rounded-md border border-border-soft bg-surface-muted p-3">
                <p className="m-0 mb-2 text-xs font-medium text-muted-text">{t("action.audit")}</p>
                <KeyValueList
                  items={[
                    { label: t("action.audit.who"), value: getAuditActor() },
                    { label: t("action.audit.when"), value: formatLagos(result.at) },
                    ...(requireReason
                      ? [{ label: t("action.audit.reason"), value: result.values.reason || "—" }]
                      : []),
                    { label: t("action.audit.ticket"), value: result.values.ticket || "—" },
                  ]}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>{t("common.close")}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              if (canAdvance) advance();
            }}
          >
            <DialogHeader>
              <DialogTitle>{step === "totp" ? t("totp.stepUpLabel") : title}</DialogTitle>
              <DialogDescription>
                {step === "totp" ? t("totp.hint") : (description ?? t("action.defaultDescription"))}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {step === "details" ? (
                <>
                  {impact ? (
                    <div className="rounded-md border border-border-soft bg-warning-bg p-3 text-sm text-warning-text">
                      {impact}
                    </div>
                  ) : null}
                  {children}
                  <div>
                    <Label htmlFor="action-ticket">{t("action.ticket")}</Label>
                    <Input
                      id="action-ticket"
                      className="mt-1"
                      autoComplete="off"
                      placeholder={t("action.ticketPlaceholder")}
                      value={values.ticket}
                      onChange={(e) => setValues({ ...values, ticket: e.target.value })}
                      aria-describedby="action-ticket-help"
                    />
                    <p id="action-ticket-help" className="m-0 mt-1 text-xs text-muted-text">
                      {t("action.ticketHelp")}
                    </p>
                  </div>
                  {requireReason ? (
                    <div>
                      <Label htmlFor="action-reason">
                        {t("action.reason")}
                        {reasonOptional ? ` (${t("action.optional")})` : ""}
                      </Label>
                      <Textarea
                        id="action-reason"
                        className="mt-1"
                        maxLength={2000}
                        value={values.reason}
                        onChange={(e) => setValues({ ...values, reason: e.target.value })}
                        aria-describedby="action-reason-help"
                      />
                      <p id="action-reason-help" className="m-0 mt-1 text-xs text-muted-text">
                        {t("action.reasonHelp")}
                      </p>
                    </div>
                  ) : null}
                  {evidenceMode !== "none" ? (
                    <FileUpload
                      label={`${t("action.evidence")}${evidenceMode === "optional" ? ` (${t("action.optional")})` : ""}`}
                      help={t("action.evidenceHelp")}
                      onChange={(evidenceFiles) =>
                        setValues((prev) => ({ ...prev, evidence: evidenceFiles }))
                      }
                    />
                  ) : null}
                  {typedConfirmation ? (
                    <div>
                      <Label htmlFor="action-typed">
                        {t("action.typeToConfirm", { word: confirmWord })}
                      </Label>
                      <Input
                        id="action-typed"
                        className="mt-1"
                        autoComplete="off"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <TotpInput
                  value={values.code}
                  onChange={(code) => setValues({ ...values, code })}
                  error={error}
                />
              )}
              {step === "details" && error ? (
                <div role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
                  <strong>{t("action.error.title")}</strong>
                  <div>{error}</div>
                </div>
              ) : null}
            </DialogBody>

            <DialogFooter>
              {step === "totp" ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setStep("details");
                    setError(undefined);
                  }}
                >
                  {t("common.back")}
                </Button>
              ) : (
                <Button variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                variant={
                  destructive && (step === "totp" || !requireTotp) ? "destructive" : "primary"
                }
                disabled={!canAdvance}
                aria-busy={busy}
              >
                {busy
                  ? t("common.working")
                  : step === "details" && requireTotp
                    ? t("common.continue")
                    : confirmLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
