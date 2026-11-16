import { BrandMark } from "@/shared/components/BrandMark";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "@/shared/api/client";
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

type Step = "credentials" | "totp" | "enrol";

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
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-ink">
            {step === "credentials" && t("auth.signIn.title")}
            {step === "totp" && t("auth.totp.title")}
            {step === "enrol" && t("auth.enrol.title")}
          </h1>
        </div>

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
            <p className="text-sm text-muted-text">{t("auth.totp.description")}</p>
            {locked ? (
              <p role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
                {t("auth.totp.locked")}
              </p>
            ) : (
              <>
                <TotpInput
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
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-text">{t("auth.enrol.description")}</p>
            <dl className="rounded-md border border-border p-3 text-sm">
              <dt className="text-xs text-muted-text">{t("auth.enrol.issuer")}</dt>
              <dd className="text-ink">{t("app.name")}</dd>
              <dt className="mt-2 text-xs text-muted-text">{t("auth.enrol.account")}</dt>
              <dd className="truncate text-ink">{email}</dd>
              <dt className="mt-2 text-xs text-muted-text">{t("auth.enrol.setupKey")}</dt>
              <dd className="tabular font-medium break-all text-ink">{groupKey(setupKey)}</dd>
            </dl>
            <TotpInput
              value={code}
              onChange={setCode}
              error={error}
              label={t("auth.enrol.confirm")}
            />
            <Button
              size="lg"
              disabled={pending || code.length !== 6}
              onClick={() => void checkCode(code, (v) => activateMfa(mfaToken, v))}
            >
              {t("auth.enrol.submit")}
            </Button>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
