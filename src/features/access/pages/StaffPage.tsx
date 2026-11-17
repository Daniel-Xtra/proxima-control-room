import { DotsThree } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
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
  assignRole,
  resetTwoFactor,
  revokeStaffSessions,
  setStaffActive,
  type StaffMember,
  type TwoFactorState,
} from "../api/accessApi";
import { accessKeys, useRoles, useStaff } from "../api/queries";

const TwoFactorBadge = defineStatusBadge<TwoFactorState>({
  enrolled: { tone: "success", label: t("staff.2fa.enrolled") },
  "not-enrolled": { tone: "warning", label: t("staff.2fa.notEnrolled") },
  "reset-pending": { tone: "warning", label: t("staff.2fa.resetPending") },
  unknown: { tone: "neutral", label: t("common.notAvailable") },
});

type Dialog = { kind: "role" | "2fa" | "toggle" | "sessions"; member: StaffMember } | null;

export function StaffPage() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const staff = useStaff();
  const roles = useRoles();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [roleId, setRoleId] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: accessKeys.staff });
  // Staff changes become approval requests, so the pending count and requests list change too.
  const refreshRequests = () => queryClient.invalidateQueries({ queryKey: ["requests"] });
  const roleName = (id: string) => roles.data?.find((r) => r.id === id)?.name ?? id;
  const close = (open: boolean) => !open && setDialog(null);

  // Changes go through a request that another admin approves; ending sessions is immediate.
  const canRequest = can("staff:manage");
  const canRevoke = can("staff:revoke_sessions");

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("staff.title") }]}
        description={t("staff.description")}
      />
      <SectionCard flush>
        <AsyncBody
          query={staff}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("staff.empty")}
        >
          {(rows) => (
            <SimpleTable<StaffMember>
              caption={t("staff.title")}
              rows={rows}
              getRowId={(r) => r.id}
              columns={[
                {
                  key: "name",
                  header: t("staff.col.name"),
                  sortValue: (r: { name: string }) => r.name,
                  cell: (r) => (
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-text">{r.email}</p>
                    </div>
                  ),
                },
                {
                  key: "roles",
                  header: t("staff.col.roles"),
                  cell: (r) => r.roleIds.map(roleName).join(", "),
                },
                {
                  key: "2fa",
                  header: t("staff.col.twoFactor"),
                  sortValue: (r: { twoFactor: string }) => r.twoFactor,
                  cell: (r) => <TwoFactorBadge status={r.twoFactor} />,
                },
                {
                  key: "status",
                  header: t("staff.col.status"),
                  sortValue: (r: { active: boolean }) => String(r.active),
                  cell: (r) => (
                    <StatusBadge
                      tone={r.active ? "success" : "neutral"}
                      label={r.active ? t("staff.active") : t("staff.disabled")}
                    />
                  ),
                },
                {
                  key: "login",
                  header: t("staff.col.lastLogin"),
                  sortValue: (r: { lastLoginAt: string | null }) => r.lastLoginAt ?? "",
                  cell: (r) =>
                    r.lastLoginAt ? <DateText iso={r.lastLoginAt} /> : t("staff.never"),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    r.id === user.id || !(canRequest || canRevoke) ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("staff.actionsFor", { name: r.name })}
                          >
                            <DotsThree aria-hidden="true" weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {canRequest ? (
                            <DropdownMenuItem
                              onSelect={() => {
                                setRoleId(r.roleIds[0] ?? "");
                                setDialog({ kind: "role", member: r });
                              }}
                            >
                              {t("staff.changeRole")}
                            </DropdownMenuItem>
                          ) : null}
                          {canRequest ? (
                            <DropdownMenuItem
                              onSelect={() => setDialog({ kind: "2fa", member: r })}
                            >
                              {t("staff.reset2fa")}
                            </DropdownMenuItem>
                          ) : null}
                          {canRequest ? (
                            <DropdownMenuItem
                              onSelect={() => setDialog({ kind: "toggle", member: r })}
                            >
                              {r.active ? t("staff.disable") : t("staff.enable")}
                            </DropdownMenuItem>
                          ) : null}
                          {canRevoke ? (
                            <DropdownMenuItem
                              onSelect={() => setDialog({ kind: "sessions", member: r })}
                            >
                              {t("staff.revokeSessions")}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ),
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <ActionDialog
        open={dialog?.kind === "role"}
        onOpenChange={close}
        title={t("staff.changeRole")}
        description={dialog?.member.name}
        impact={t("staff.assign.impact")}
        confirmLabel={t("staff.changeRole")}
        blocked={roleId === "" || roleId === dialog?.member.roleIds[0]}
        onConfirm={async ({ reason }) => {
          if (dialog) await assignRole(dialog.member.id, roleId, reason);
          await refreshRequests();
          return t("staff.assign.done");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-role">{t("staff.col.roles")}</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger id="staff-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(roles.data ?? []).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ActionDialog>

      <ActionDialog
        open={dialog?.kind === "2fa"}
        onOpenChange={close}
        title={t("staff.reset2fa")}
        description={dialog?.member.name}
        impact={t("staff.reset2fa.impact")}
        confirmLabel={t("staff.reset2fa")}
        destructive
        onConfirm={async ({ reason }) => {
          if (dialog) await resetTwoFactor(dialog.member.id, reason);
          await refreshRequests();
          return t("staff.reset2fa.done");
        }}
      />

      <ActionDialog
        open={dialog?.kind === "toggle"}
        onOpenChange={close}
        title={dialog?.member.active ? t("staff.disable") : t("staff.enable")}
        description={dialog?.member.name}
        impact={dialog?.member.active ? t("staff.disable.impact") : t("staff.enable.impact")}
        confirmLabel={dialog?.member.active ? t("staff.disable") : t("staff.enable")}
        destructive={dialog?.member.active}
        onConfirm={async ({ reason }) => {
          if (dialog) await setStaffActive(dialog.member.id, !dialog.member.active, reason);
          await refreshRequests();
          return t("staff.toggle.done");
        }}
      />

      <ActionDialog
        open={dialog?.kind === "sessions"}
        onOpenChange={close}
        title={t("staff.revokeSessions")}
        description={dialog?.member.name}
        impact={t("staff.revokeSessions.impact")}
        confirmLabel={t("staff.revokeSessions")}
        destructive
        onConfirm={async ({ reason }) => {
          if (dialog) await revokeStaffSessions(dialog.member.id, reason);
          await refresh();
          return t("staff.revokeSessions.done");
        }}
      />
    </>
  );
}
