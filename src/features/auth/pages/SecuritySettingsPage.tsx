import { DeviceMobile, Key, Password } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { ThemeSwitch } from "@/shared/components/ThemeSwitch";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { fetchRecoveryCodesRemaining, requestOwnReset } from "../api/authApi";
import { listSessions } from "../api/sessionsApi";
import { AccountIdentityCard } from "../components/AccountIdentityCard";
import { ReplaceRecoveryCodesDialog } from "../components/ReplaceRecoveryCodesDialog";
import { SecurityRow } from "../components/SecurityRow";
import { SessionList } from "../components/SessionList";
import { SignOutOthersDialog } from "../components/SignOutOthersDialog";
import { useCan, useCurrentUser } from "../hooks/useSession";

const SESSIONS_KEY = ["auth", "sessions"];
const RECOVERY_KEY = ["auth", "recovery-remaining"];

export function SecuritySettingsPage() {
  const user = useCurrentUser();
  const can = useCan();
  // Anyone who can decide these requests may not make one for themselves; the server enforces the same rule.
  const canRequestReset = !can("2fa:reset");
  const [resetKind, setResetKind] = useState<"password" | "mfa" | null>(null);
  const queryClient = useQueryClient();
  const sessions = useApiQuery(SESSIONS_KEY, listSessions, { staleTime: 0 });
  const remaining = useApiQuery(RECOVERY_KEY, fetchRecoveryCodesRemaining, {
    enabled: user.twoFactorEnrolled,
    staleTime: 0,
  });
  const left = remaining.data ?? 0;
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [codesOpen, setCodesOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={t("security.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("security.title") }]}
        description={t("security.description")}
      />
      <div className="flex flex-col gap-4">
        <AccountIdentityCard name={user.name} email={user.email} roles={user.roleNames} />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <SectionCard title={t("security.signIn")} flush>
            <div className="divide-y divide-border-soft">
              <SecurityRow
                icon={DeviceMobile}
                title={t("security.twoFactor")}
                hint={t("security.twoFactorHint")}
              >
                <StatusBadge
                  tone={user.twoFactorEnrolled ? "success" : "warning"}
                  label={
                    user.twoFactorEnrolled ? t("security.enrolled") : t("security.notEnrolled")
                  }
                />
                {canRequestReset && user.twoFactorEnrolled ? (
                  <Button variant="outline" onClick={() => setResetKind("mfa")}>
                    {t("security.twoFactor.request")}
                  </Button>
                ) : null}
              </SecurityRow>
              <SecurityRow
                icon={Password}
                title={t("security.password.title")}
                hint={canRequestReset ? t("security.password.hint") : t("security.approverNote")}
              >
                {canRequestReset ? (
                  <Button variant="outline" onClick={() => setResetKind("password")}>
                    {t("security.password.request")}
                  </Button>
                ) : null}
              </SecurityRow>
              {user.twoFactorEnrolled ? (
                <SecurityRow
                  icon={Key}
                  title={t("security.recovery.title")}
                  hint={
                    remaining.data === undefined
                      ? t("security.recovery.hint")
                      : t("security.recovery.left", { count: left })
                  }
                >
                  {remaining.data !== undefined && left <= 2 ? (
                    <StatusBadge tone="warning" label={String(left)} />
                  ) : null}
                  <Button variant="outline" onClick={() => setCodesOpen(true)}>
                    {t("security.recovery.generate")}
                  </Button>
                </SecurityRow>
              ) : null}
            </div>
          </SectionCard>
          <div className="flex flex-col gap-4">
            <SectionCard
              title={t("security.sessions")}
              description={t("security.sessionsHint")}
              flush
              actions={
                <Button
                  variant="outline"
                  disabled={!sessions.data?.some((row) => !row.current)}
                  onClick={() => setSignOutOpen(true)}
                >
                  {t("security.signOutOthers")}
                </Button>
              }
            >
              <AsyncBody query={sessions} isEmpty={(rows) => rows.length === 0}>
                {(rows) => <SessionList rows={rows} />}
              </AsyncBody>
            </SectionCard>
            <SectionCard
              title={t("security.appearance")}
              description={t("security.appearanceHint")}
            >
              <ThemeSwitch />
            </SectionCard>
          </div>
        </div>
      </div>

      <ReplaceRecoveryCodesDialog
        open={codesOpen}
        onOpenChange={setCodesOpen}
        remaining={remaining.data}
        onReplaced={() => void queryClient.invalidateQueries({ queryKey: RECOVERY_KEY })}
      />

      <ActionDialog
        open={resetKind !== null}
        onOpenChange={(open) => !open && setResetKind(null)}
        title={
          resetKind === "mfa"
            ? t("security.twoFactor.dialogTitle")
            : t("security.password.dialogTitle")
        }
        impact={
          resetKind === "mfa" ? t("security.twoFactor.impact") : t("security.password.impact")
        }
        confirmLabel={
          resetKind === "mfa" ? t("security.twoFactor.request") : t("security.password.request")
        }
        requireTotp={user.twoFactorEnrolled}
        onConfirm={async ({ reason }) => {
          await requestOwnReset(resetKind === "mfa" ? "mfa" : "password", user.id, reason);
          return resetKind === "mfa" ? t("security.twoFactor.sent") : t("security.password.sent");
        }}
      />

      <SignOutOthersDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        sessions={sessions.data ?? []}
        onDone={() => void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })}
      />
    </>
  );
}
