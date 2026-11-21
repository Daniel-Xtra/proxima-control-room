import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "@/shared/api/client";
import { BrandWordmark } from "@/shared/components/BrandWordmark";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { humanize } from "@/shared/lib/format";
import { t } from "@/shared/i18n/t";
import { CopyrightFooter } from "@/shared/components/CopyrightFooter";
import { acceptInvitation, previewInvitation } from "../api/authApi";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { passwordProblem } from "../model/password";

/** Where the emailed invitation link lands: the invitee sets their own password. */
export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const invitation = useApiQuery(["auth", "invitation", token], () => previewInvitation(token), {
    enabled: token !== "",
    retry: false,
    staleTime: Infinity,
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const problem = passwordProblem(password);
  const mismatch = confirm !== "" && confirm !== password;
  const invalid = token === "" || invitation.isError;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await acceptInvitation(token, password);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("state.error.title"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <AuthBackdrop />
      <div className="relative z-10">
        <BrandWordmark className="h-12" onDarkBackground />
      </div>
      <Card className="auth-card relative z-10 w-full max-w-md gap-0 px-6 py-6">
        <h1 className="mb-1 text-2xl font-semibold text-ink">{t("auth.invite.title")}</h1>

        {done ? (
          <div className="mt-3 flex flex-col gap-4">
            <p className="text-sm text-muted-text">{t("auth.invite.done")}</p>
            <Button asChild size="lg">
              <Link to="/">{t("auth.signIn.submit")}</Link>
            </Button>
          </div>
        ) : invalid ? (
          <div className="mt-3 flex flex-col gap-4">
            <p role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
              {t("auth.invite.invalid")}
            </p>
            <Button asChild variant="outline" size="lg">
              <Link to="/">{t("auth.backToSignIn")}</Link>
            </Button>
          </div>
        ) : invitation.data ? (
          <form className="mt-3 flex flex-col gap-4" onSubmit={onSubmit}>
            <p className="text-sm text-muted-text">
              {t("auth.invite.welcome", {
                name: `${invitation.data.firstName} ${invitation.data.lastName}`.trim(),
                role: humanize(invitation.data.roleCode),
              })}
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">{t("auth.email")}</Label>
              <Input id="invite-email" value={invitation.data.email} readOnly disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-password">{t("auth.password")}</Label>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={password !== "" && problem ? true : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-text">{t("auth.invite.rules")}</p>
              {password !== "" && problem ? (
                <p className="text-sm text-danger-text">{t(problem)}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-confirm">{t("auth.invite.confirm")}</Label>
              <Input
                id="invite-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                aria-invalid={mismatch ? true : undefined}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {mismatch ? (
                <p className="text-sm text-danger-text">{t("auth.invite.mismatch")}</p>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger-text">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              disabled={pending || problem !== null || password !== confirm}
            >
              {pending ? t("common.working") : t("auth.invite.submit")}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-text">{t("common.working")}</p>
        )}
      </Card>
      <CopyrightFooter className="absolute inset-x-0 bottom-4 z-10 text-white/70" />
    </main>
  );
}
