import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandWordmark } from "@/shared/components/BrandWordmark";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { PasswordInput } from "@/shared/components/ui/PasswordInput";
import { Label } from "@/shared/components/ui/Label";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { errorMessage } from "@/shared/lib/errorMessage";
import { CopyrightFooter } from "@/shared/components/CopyrightFooter";
import { acceptInvitation, previewInvitation } from "../api/authApi";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { PasswordRules } from "../components/PasswordRules";
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
  const [done, setDone] = useState(false);
  const accept = useMutation({
    mutationFn: () => acceptInvitation(token, password),
    onSuccess: () => setDone(true),
  });
  const pending = accept.isPending;
  const error = accept.isError ? errorMessage(accept.error) : undefined;

  const problem = passwordProblem(password);
  const mismatch = confirm !== "" && confirm !== password;
  const invalid = token === "" || invitation.isError;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    accept.mutate();
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">{t("auth.email")}</Label>
              <Input id="invite-email" value={invitation.data.email} readOnly disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-password">{t("auth.password")}</Label>
              <PasswordInput
                id="invite-password"
                placeholder={t("auth.password.newPlaceholder")}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordRules password={password} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-confirm">{t("auth.invite.confirm")}</Label>
              <PasswordInput
                id="invite-confirm"
                placeholder={t("auth.password.confirmPlaceholder")}
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
