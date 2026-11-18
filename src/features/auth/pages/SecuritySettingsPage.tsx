import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { listSessions, revokeOtherSessions, type SessionRow } from "../api/sessionsApi";
import { useCurrentUser } from "../hooks/useSession";

const SESSIONS_KEY = ["auth", "sessions"];

export function SecuritySettingsPage() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const sessions = useApiQuery(SESSIONS_KEY, listSessions, { staleTime: 0 });
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={t("security.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("security.title") }]}
        description={t("security.description")}
      />
      <div className="flex flex-col gap-4">
        <SectionCard title={t("security.profile")}>
          <KeyValueList
            items={[
              { label: t("security.name"), value: user.name },
              { label: t("auth.email"), value: user.email },
              { label: t("security.roles"), value: user.roleNames.join(", ") },
            ]}
          />
        </SectionCard>

        <SectionCard title={t("security.twoFactor")} description={t("security.twoFactorHint")}>
          <StatusBadge
            tone={user.twoFactorEnrolled ? "success" : "warning"}
            label={user.twoFactorEnrolled ? t("security.enrolled") : t("security.notEnrolled")}
          />
        </SectionCard>

        <SectionCard
          title={t("security.sessions")}
          flush
          actions={
            <Button variant="outline" onClick={() => setSignOutOpen(true)}>
              {t("security.signOutOthers")}
            </Button>
          }
        >
          <AsyncBody query={sessions} isEmpty={(rows) => rows.length === 0}>
            {(rows) => (
              <SimpleTable<SessionRow>
                storageKey="sessions"
                caption={t("security.sessions")}
                rows={rows}
                getRowId={(row) => row.id}
                columns={[
                  { key: "device", header: t("security.device"), cell: (r) => r.device },
                  { key: "ip", header: t("audit.ip"), cell: (r) => r.ip },
                  {
                    key: "active",
                    header: t("security.lastActive"),
                    cell: (r) => <DateText iso={r.lastActive} />,
                  },
                  {
                    key: "current",
                    header: t("common.status"),
                    cell: (r) =>
                      r.current ? (
                        <StatusBadge tone="info" label={t("security.thisDevice")} />
                      ) : (
                        <StatusBadge tone="neutral" label={t("security.signedIn")} />
                      ),
                  },
                ]}
              />
            )}
          </AsyncBody>
        </SectionCard>
      </div>

      <ActionDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title={t("security.signOutOthers")}
        impact={t("security.signOutImpact")}
        confirmLabel={t("security.signOutOthers")}
        requireReason={false}
        requireTotp={false}
        onConfirm={async () => {
          await revokeOtherSessions(sessions.data ?? []);
          await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
          return t("security.signedOutOthers");
        }}
      />
    </>
  );
}
