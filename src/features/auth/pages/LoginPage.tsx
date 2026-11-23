import { BrandWordmark } from "@/shared/components/BrandWordmark";
import { ArrowLeft, DeviceMobile, Key, Lock, ShieldCheck } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/api/client";
import { QrCode } from "@/shared/components/QrCode";
import { TotpInput } from "@/shared/components/TotpInput";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { PasswordInput } from "@/shared/components/ui/PasswordInput";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import {
  activateMfa,
  beginEnrolment,
  fetchSessionUser,
  login,
  sendEmailCode,
  verifyMfa,
} from "../api/authApi";
import { CopyrightFooter } from "@/shared/components/CopyrightFooter";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { LockoutCountdown } from "../components/LockoutCountdown";
import { RecoveryCodes } from "../components/RecoveryCodes";
import { ResendCode } from "../components/ResendCode";
import { useSession } from "../hooks/useSession";

type Step = "credentials" | "deviceLocked" | "totp" | "enrol" | "confirm" | "recovery" | "done";
type Method = "app" | "recovery" | "email";

const METHODS: Method[] = ["app", "recovery", "email"];
/** The wait shown when the server locks something but does not say for how long. */
const FALLBACK_LOCK_SECONDS = 15 * 60;

/** Groups the secret in fours so it is easy to type into an authenticator app. */
function groupKey(secret: string) {
  return secret
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function LoginPage() {
  const { signIn } = useSession();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<Method>("app");
  const [emailCodeAvailable, setEmailCodeAvailable] = useState(false);
  const [emailSent, setEmailSent] = useState<{ to: string; resendAt: number } | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  /** Set by the server: verification, or the whole sign-in, is refused until this time. */
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [attemptsLeft, setAttemptsLeft] = useState<number>();

  const verificationLocked = step === "totp" && lockedUntil !== null;
  const locked = verificationLocked || step === "deviceLocked";
  const alternatives = METHODS.filter(
    (candidate) => candidate !== method && (candidate !== "email" || emailCodeAvailable),
  );

  /** Keeps what the server said: a wait, tries left, or just the message. */
  function explain(caught: unknown) {
    if (!(caught instanceof ApiError)) {
      setError(t("state.error.title"));
      return;
    }
    const wait = (caught.details.retryAfterSeconds ?? FALLBACK_LOCK_SECONDS) * 1000;
    if (caught.status === 423) {
      setLockedUntil(Date.now() + wait);
      setStep(caught.details.deviceLocked ? "deviceLocked" : "totp");
      return;
    }
    setError(caught.message);
    setAttemptsLeft(caught.details.attemptsRemaining);
  }

  // Every sign-in step is one attempt: it clears the last message, and a failure is explained.
  const attempt = useMutation({
    mutationFn: (action: () => Promise<void>) => action(),
    onMutate: () => setError(undefined),
    onError: explain,
  });
  const pending = attempt.isPending;
  const run = (action: () => Promise<void>) => attempt.mutate(action);

  /** Tokens are stored by now: load the profile and permissions, then enter the app. */
  async function finish() {
    signIn(await fetchSessionUser());
  }

  /** Runs a check that can fail on a wrong code. Enrolment returns recovery codes, shown before the app opens. */
  function submit(confirm: () => Promise<string[] | void>) {
    run(async () => {
      let codes: string[] | void;
      try {
        codes = await confirm();
      } catch (caught) {
        setCode("");
        setRecoveryCode("");
        throw caught;
      }
      if (codes && codes.length > 0) {
        setRecoveryCodes(codes);
        setStep("recovery");
        return;
      }
      await finish();
    });
  }

  /** Drops the half-finished sign-in so another account can be used. */
  function backToSignIn() {
    setStep("credentials");
    setMfaToken("");
    setPassword("");
    setCode("");
    setRecoveryCode("");
    setMethod("app");
    setEmailSent(null);
    setLockedUntil(null);
    setAttemptsLeft(undefined);
    setError(undefined);
  }

  /** The wait is over: the server will accept a try again. */
  function unlock() {
    if (step === "deviceLocked") {
      backToSignIn();
      return;
    }
    setLockedUntil(null);
    setAttemptsLeft(undefined);
    setError(undefined);
  }

  function requestEmailCode() {
    run(async () => {
      const sent = await sendEmailCode(mfaToken);
      setEmailSent({ to: sent.sentTo, resendAt: Date.now() + sent.resendInSeconds * 1000 });
    });
  }

  function chooseMethod(next: Method) {
    setMethod(next);
    setError(undefined);
    setAttemptsLeft(undefined);
    setCode("");
    setRecoveryCode("");
    if (next === "email" && !emailSent) requestEmailCode();
  }

  function onCredentials(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      const result = await login(email, password);
      if (result.kind === "session") return finish();
      setMfaToken(result.mfaToken);
      setEmailCodeAvailable(result.emailCodeAvailable);
      setCode("");
      setMethod("app");
      setEmailSent(null);
      setAttemptsLeft(undefined);
      if (result.enrolled) {
        setStep("totp");
        return;
      }
      const enrolment = await beginEnrolment(result.mfaToken);
      setSetupKey(enrolment.secret);
      setOtpauthUri(enrolment.otpauthUri);
      setStep("enrol");
    });
  }

  const problem = error
    ? attemptsLeft === undefined
      ? error
      : `${error} ${t("auth.totp.remaining", { count: attemptsLeft })}`
    : undefined;
  const readyToVerify =
    method === "recovery"
      ? recoveryCode.length >= 10
      : code.length === 6 && (method !== "email" || emailSent !== null);

  function verifyNow() {
    if (method === "recovery") {
      submit(() => verifyMfa(mfaToken, { recoveryCode }));
    } else if (method === "email") {
      submit(() => verifyMfa(mfaToken, { emailCode: code }));
    } else {
      submit(() => verifyMfa(mfaToken, { code }));
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <AuthBackdrop />
      <div className="relative z-10">
        <BrandWordmark className="h-12" onDarkBackground />
      </div>
      <Card className="auth-card relative z-10 w-full max-w-md gap-0 py-6 px-6">
        {step === "credentials" ? (
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-ink">{t("auth.signIn.title")}</h1>
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-info-bg text-info-text">
              {locked ? (
                <Lock aria-hidden="true" className="size-6" weight="duotone" />
              ) : step === "recovery" ? (
                <Key aria-hidden="true" className="size-6" weight="duotone" />
              ) : step === "done" ? (
                <ShieldCheck aria-hidden="true" className="size-6" weight="fill" />
              ) : step === "totp" || step === "confirm" ? (
                <ShieldCheck aria-hidden="true" className="size-6" weight="duotone" />
              ) : (
                <DeviceMobile aria-hidden="true" className="size-6" weight="duotone" />
              )}
            </span>
            <h1 className="text-xl font-semibold text-ink">
              {step === "deviceLocked" && t("auth.deviceLock.title")}
              {step === "totp" &&
                (verificationLocked ? t("auth.lock.title") : t("auth.totp.title"))}
              {step === "enrol" && t("auth.enrol.title")}
              {step === "confirm" && t("auth.enrol.confirmTitle")}
              {step === "recovery" && t("auth.recovery.title")}
              {step === "done" && t("auth.done.title")}
            </h1>
            <p className="m-0 mt-1 text-sm text-muted-text">
              {step === "deviceLocked" && t("auth.deviceLock.description")}
              {step === "totp" &&
                (verificationLocked
                  ? t("auth.lock.description")
                  : method === "recovery"
                    ? t("auth.totp.descriptionRecovery")
                    : method === "email"
                      ? t("auth.totp.descriptionEmail")
                      : t("auth.totp.description"))}
              {step === "enrol" && t("auth.enrol.description")}
              {step === "confirm" && t("auth.enrol.confirmDescription")}
              {step === "recovery" && t("auth.recovery.description")}
              {step === "done" && t("auth.done.description")}
            </p>
          </div>
        )}

        {step === "credentials" ? (
          <form className="flex flex-col gap-4" onSubmit={onCredentials}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <PasswordInput
                id="password"
                placeholder={t("auth.password.placeholder")}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger-text">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={pending || !email || !password}>
              {pending ? t("common.working") : t("auth.signIn.submit")}
            </Button>
          </form>
        ) : null}

        {step === "deviceLocked" && lockedUntil !== null ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-danger-border bg-danger-bg px-3 py-1 text-xs font-medium text-danger-text">
              <Lock aria-hidden="true" className="size-3.5" weight="fill" />
              {t("auth.deviceLock.badge")}
            </span>
            <LockoutCountdown
              until={lockedUntil}
              onElapsed={unlock}
              label={(time) => t("auth.deviceLock.retry", { time })}
            />
          </div>
        ) : null}

        {step === "totp" ? (
          <div className="flex flex-col gap-4">
            {verificationLocked && lockedUntil !== null ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-danger-border bg-danger-bg px-3 py-1 text-xs font-medium text-danger-text">
                  <Lock aria-hidden="true" className="size-3.5" weight="fill" />
                  {t("auth.lock.badge")}
                </span>
                <LockoutCountdown until={lockedUntil} onElapsed={unlock} />
                <Button type="button" variant="outline" onClick={backToSignIn}>
                  {t("auth.backToSignIn")}
                </Button>
              </div>
            ) : (
              <>
                {method === "recovery" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="recovery-code">{t("auth.totp.recoveryLabel")}</Label>
                    <Input
                      id="recovery-code"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={11}
                      placeholder={t("auth.totp.recoveryPlaceholder")}
                      value={recoveryCode}
                      onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && readyToVerify && !pending) verifyNow();
                      }}
                      className="tabular font-mono"
                    />
                    {problem ? (
                      <p role="alert" className="m-0 text-xs text-danger-text">
                        {problem}
                      </p>
                    ) : null}
                  </div>
                ) : method === "email" && !emailSent ? (
                  <>
                    {problem ? (
                      <p role="alert" className="m-0 text-sm text-danger-text">
                        {problem}
                      </p>
                    ) : null}
                    <Button size="lg" disabled={pending} onClick={() => void requestEmailCode()}>
                      {pending ? t("common.working") : t("auth.email.send")}
                    </Button>
                  </>
                ) : (
                  <>
                    {method === "email" && emailSent ? (
                      <p className="m-0 text-center text-sm text-muted-text">
                        {t("auth.email.sent", { email: emailSent.to })}
                      </p>
                    ) : null}
                    <TotpInput
                      hideLabel
                      value={code}
                      onChange={setCode}
                      label={method === "email" ? t("auth.totp.emailLabel") : undefined}
                      error={problem}
                      onComplete={(value) =>
                        submit(() =>
                          method === "email"
                            ? verifyMfa(mfaToken, { emailCode: value })
                            : verifyMfa(mfaToken, { code: value }),
                        )
                      }
                    />
                  </>
                )}
                {method !== "email" || emailSent ? (
                  <Button size="lg" disabled={pending || !readyToVerify} onClick={verifyNow}>
                    {pending ? t("common.working") : t("auth.totp.verify")}
                  </Button>
                ) : null}
                {method === "email" && emailSent ? (
                  <ResendCode
                    until={emailSent.resendAt}
                    disabled={pending}
                    onResend={() => void requestEmailCode()}
                  />
                ) : null}
                {alternatives.length > 0 ? (
                  <div className="flex flex-col gap-1.5 rounded-md border border-border-soft bg-surface-muted px-3 py-3 text-sm">
                    <span className="text-ink">{t("auth.totp.handy")}</span>
                    {alternatives.map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        disabled={pending}
                        onClick={() => chooseMethod(candidate)}
                        className="cursor-pointer self-start text-sm font-medium text-blue-strong hover:underline disabled:opacity-50"
                      >
                        {candidate === "app"
                          ? t("auth.totp.useApp")
                          : candidate === "recovery"
                            ? t("auth.totp.useRecovery")
                            : t("auth.totp.useEmail")}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {step === "enrol" ? (
          <div className="flex flex-col items-center gap-4">
            <QrCode value={otpauthUri} label={t("auth.enrol.qrLabel")} size={192} />
            <details className="w-full text-center text-sm">
              <summary className="cursor-pointer text-muted-text hover:text-ink">
                {t("auth.enrol.noScan")}
              </summary>
              <p className="tabular m-0 mt-2 rounded-md bg-surface-muted px-3 py-2 font-medium break-all text-ink">
                {groupKey(setupKey)}
              </p>
            </details>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setCode("");
                setError(undefined);
                setStep("confirm");
              }}
            >
              {t("auth.enrol.next")}
            </Button>
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="flex flex-col gap-4">
            <TotpInput
              hideLabel
              value={code}
              onChange={setCode}
              error={error}
              label={t("auth.enrol.confirm")}
              onComplete={(value) => submit(() => activateMfa(mfaToken, value))}
            />
            <Button
              size="lg"
              disabled={pending || code.length !== 6}
              onClick={() => submit(() => activateMfa(mfaToken, code))}
            >
              {pending ? t("common.working") : t("auth.enrol.submit")}
            </Button>
          </div>
        ) : null}

        {step === "recovery" ? (
          <div className="flex flex-col gap-4">
            <RecoveryCodes codes={recoveryCodes} />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={saved}
                onChange={(event) => setSaved(event.target.checked)}
                className="size-4"
              />
              {t("auth.recovery.saved")}
            </label>
            <Button size="lg" disabled={!saved} onClick={() => setStep("done")}>
              {t("auth.recovery.continue")}
            </Button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col gap-4">
            <p className="m-0 rounded-md border border-warning-border bg-warning-bg px-3 py-2.5 text-sm text-warning-text">
              {t("auth.done.note")}
            </p>
            <Button size="lg" disabled={pending} onClick={() => void run(finish)}>
              {pending ? t("common.working") : t("auth.done.go")}
            </Button>
          </div>
        ) : null}

        {step !== "credentials" &&
        step !== "recovery" &&
        step !== "done" &&
        step !== "deviceLocked" &&
        !verificationLocked ? (
          <div className="mt-6 flex justify-center border-t border-border-soft pt-4">
            <button
              type="button"
              disabled={pending}
              onClick={
                step === "confirm"
                  ? () => {
                      setError(undefined);
                      setStep("enrol");
                    }
                  : backToSignIn
              }
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-text transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {step === "confirm" ? t("auth.enrol.back") : t("auth.backToSignIn")}
            </button>
          </div>
        ) : null}
      </Card>
      <CopyrightFooter className="absolute inset-x-0 bottom-4 z-10 text-white/70" />
    </main>
  );
}
