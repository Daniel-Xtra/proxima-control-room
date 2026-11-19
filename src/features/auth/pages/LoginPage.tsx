import { BrandMark } from "@/shared/components/BrandMark";
import { ArrowLeft, DeviceMobile, ShieldCheck } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "@/shared/api/client";
import { QrCode } from "@/shared/components/QrCode";
import { TotpInput } from "@/shared/components/TotpInput";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import {
  MAX_CODE_ATTEMPTS,
  activateMfa,
  beginEnrolment,
  fetchSessionUser,
  login,
  verifyMfa,
} from "../api/authApi";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { useSession } from "../hooks/useSession";

type Step = "credentials" | "totp" | "enrol" | "confirm";

/** Groups the secret in fours so it is easy to type into an authenticator app. */
function groupKey(secret: string) {
  return secret
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function LoginPage() {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [failures, setFailures] = useState(0);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const locked = failures >= MAX_CODE_ATTEMPTS;

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(undefined);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("state.error.title"));
    } finally {
      setPending(false);
    }
  }

  /** Tokens are stored by now: load the profile and permissions, then enter the app. */
  async function finish() {
    signIn(await fetchSessionUser());
    navigate("/", { replace: true });
  }

  async function checkCode(value: string, confirm: (value: string) => Promise<void>) {
    await run(async () => {
      try {
        await confirm(value);
      } catch (caught) {
        setFailures((n) => n + 1);
        setCode("");
        throw caught;
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
    setFailures(0);
    setError(undefined);
  }

  function onCredentials(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const result = await login(email, password);
      if (result.kind === "session") return finish();
      setMfaToken(result.mfaToken);
      setCode("");
      setFailures(0);
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

  return (
    <main className="auth-backdrop relative flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <AuthBackdrop />
      <div className="relative z-10 flex items-center gap-2.5">
        <BrandMark />
        <span className="text-base font-semibold tracking-tight text-ink">{t("app.name")}</span>
      </div>
      <Card className="auth-card relative z-10 w-full max-w-md gap-0 py-6 px-6">
        {step === "credentials" ? (
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-ink">{t("auth.signIn.title")}</h1>
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-info-bg text-info-text">
              {step === "totp" || step === "confirm" ? (
                <ShieldCheck aria-hidden="true" className="size-6" weight="duotone" />
              ) : (
                <DeviceMobile aria-hidden="true" className="size-6" weight="duotone" />
              )}
            </span>
            <h1 className="text-xl font-semibold text-ink">
              {step === "totp" && t("auth.totp.title")}
              {step === "enrol" && t("auth.enrol.title")}
              {step === "confirm" && t("auth.enrol.confirmTitle")}
            </h1>
            <p className="m-0 mt-1 text-sm text-muted-text">
              {step === "totp" && t("auth.totp.description")}
              {step === "enrol" && t("auth.enrol.description")}
              {step === "confirm" && t("auth.enrol.confirmDescription")}
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
              <Input
                id="password"
                type="password"
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

        {step === "totp" ? (
          <div className="flex flex-col gap-4">
            {locked ? (
              <p role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
                {t("auth.totp.locked")}
              </p>
            ) : (
              <>
                <TotpInput
                  hideLabel
                  value={code}
                  onChange={setCode}
                  error={
                    error
                      ? `${error} ${t("auth.totp.remaining", { count: MAX_CODE_ATTEMPTS - failures })}`
                      : undefined
                  }
                  onComplete={(value) => void checkCode(value, (v) => verifyMfa(mfaToken, v))}
                />
                <Button
                  size="lg"
                  disabled={pending || code.length !== 6}
                  onClick={() => void checkCode(code, (v) => verifyMfa(mfaToken, v))}
                >
                  {pending ? t("common.working") : t("auth.totp.verify")}
                </Button>
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
              onComplete={(value) => void checkCode(value, (v) => activateMfa(mfaToken, v))}
            />
            <Button
              size="lg"
              disabled={pending || code.length !== 6}
              onClick={() => void checkCode(code, (v) => activateMfa(mfaToken, v))}
            >
              {pending ? t("common.working") : t("auth.enrol.submit")}
            </Button>
          </div>
        ) : null}

        {step !== "credentials" ? (
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
    </main>
  );
}
