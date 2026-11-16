import { QrCode } from "@phosphor-icons/react";
import { BrandMark } from "@/shared/components/BrandMark";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "@/shared/api/client";
import { TotpInput } from "@/shared/components/TotpInput";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import {
  MAX_CODE_ATTEMPTS,
  SETUP_KEY,
  buildSessionUser,
  setNewPassword,
  submitCredentials,
  verifyTotp,
} from "../api/authApi";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { useSession } from "../hooks/useSession";
import { ROLE_TEMPLATES } from "../model/roleTemplates";

type Step = "credentials" | "totp" | "new-password" | "enrol";

export function LoginPage() {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("amaka.eze@proxima.example");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(ROLE_TEMPLATES[0]!.id);
  const [firstLogin, setFirstLogin] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPasswordValue] = useState("");
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

  function finish() {
    signIn(buildSessionUser(email, roleId, firstLogin));
    navigate("/", { replace: true });
  }

  async function checkCode(value: string, next: () => void) {
    await run(async () => {
      try {
        await verifyTotp(value);
        next();
      } catch (caught) {
        setFailures((n) => n + 1);
        setCode("");
        throw caught;
      }
    });
  }

  function onCredentials(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const result = await submitCredentials(email, password);
      setFirstLogin(result.firstLogin);
      setStep(result.firstLogin ? "new-password" : "totp");
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
            {step === "new-password" && t("auth.password.title")}
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
            <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border-strong p-3">
              <Label htmlFor="demo-role">{t("auth.demoRole")}</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="demo-role" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TEMPLATES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-text">{t("auth.demoHint")}</p>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger-text">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={pending}>
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
                  onComplete={(value) => void checkCode(value, finish)}
                />
                <Button
                  size="lg"
                  disabled={pending || code.length !== 6}
                  onClick={() => void checkCode(code, finish)}
                >
                  {pending ? t("common.working") : t("auth.totp.verify")}
                </Button>
              </>
            )}
          </div>
        ) : null}

        {step === "new-password" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await setNewPassword(newPassword);
                setStep("enrol");
              });
            }}
          >
            <p className="text-sm text-muted-text">{t("auth.password.description")}</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">{t("auth.password.new")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPasswordValue(e.target.value)}
              />
              {error ? (
                <p role="alert" className="text-sm text-danger-text">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={pending}>
              {t("common.continue")}
            </Button>
          </form>
        ) : null}

        {step === "enrol" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-text">{t("auth.enrol.description")}</p>
            <div className="flex items-center gap-4 rounded-md border border-border p-3">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-text">
                <QrCode aria-hidden="true" className="size-12" />
                <span className="sr-only">{t("auth.enrol.qrLabel")}</span>
              </div>
              <dl className="min-w-0 text-sm">
                <dt className="text-xs text-muted-text">{t("auth.enrol.issuer")}</dt>
                <dd className="text-ink">{t("app.name")}</dd>
                <dt className="mt-2 text-xs text-muted-text">{t("auth.enrol.account")}</dt>
                <dd className="truncate text-ink">{email}</dd>
                <dt className="mt-2 text-xs text-muted-text">{t("auth.enrol.setupKey")}</dt>
                <dd className="tabular font-medium text-ink">{SETUP_KEY}</dd>
              </dl>
            </div>
            <TotpInput
              value={code}
              onChange={setCode}
              error={error}
              label={t("auth.enrol.confirm")}
            />
            <Button
              size="lg"
              disabled={pending || code.length !== 6}
              onClick={() => void checkCode(code, finish)}
            >
              {t("auth.enrol.submit")}
            </Button>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
