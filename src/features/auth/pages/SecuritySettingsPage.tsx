import { useState } from "react";
import { recordAudit } from "@/shared/api/auditStore";
import { simulate } from "@/shared/api/client";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { useCurrentUser } from "../hooks/useSession";

interface SessionRow {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

const INITIAL_SESSIONS: SessionRow[] = [
  {
    id: "s1",
    device: "Chrome on Windows",
    ip: "102.89.34.17",
    lastActive: "2026-11-15T09:40:00.000Z",
    current: true,
  },
  {
    id: "s2",
    device: "Safari on macOS",
    ip: "105.112.8.201",
    lastActive: "2026-11-14T16:05:00.000Z",
    current: false,
  },
  {
    id: "s3",
    device: "Firefox on Linux",
    ip: "197.210.65.9",
    lastActive: "2026-11-12T11:22:00.000Z",
    current: false,
  },
];

export function SecuritySettingsPage() {
  const user = useCurrentUser();
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
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
          <SimpleTable
            caption={t("security.sessions")}
            rows={sessions}
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
          await simulate(() => undefined);
          setSessions((rows) => rows.filter((row) => row.current));
          recordAudit({ action: "auth.sessions.revoke_others", target: user.email });
          return t("security.signedOutOthers");
        }}
      />
    </>
  );
}
