import { DotsThree, Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import {
  assignRole,
  inviteStaff,
  resetTwoFactor,
  revokeStaffSessions,
  setStaffActive,
  type StaffMember,
  type TwoFactorState,
} from "../api/accessApi";
import { accessKeys, useRoles, useStaff } from "../api/queries";
import { InvitationDialog } from "../components/InvitationDialog";

const TwoFactorBadge = defineStatusBadge<TwoFactorState>({
  enrolled: { tone: "success", label: t("staff.2fa.enrolled") },
  "not-enrolled": { tone: "warning", label: t("staff.2fa.notEnrolled") },
  "reset-pending": { tone: "warning", label: t("staff.2fa.resetPending") },
  unknown: { tone: "neutral", label: t("common.notAvailable") },
});

type Dialog = {
  kind: "role" | "2fa" | "toggle" | "sessions" | "resend" | "revoke-invite";
  member: StaffMember;
} | null;

const BLANK_INVITE = { email: "", firstName: "", lastName: "", phone: "", roleCode: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StaffPage() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const [filters, setFilter] = useUrlFilters({ q: "", page: "1", limit: "10" });
  const staff = useStaff(Number(filters.page), Number(filters.limit), filters.q);
  const roles = useRoles();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [roleId, setRoleId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState(BLANK_INVITE);
  const setField = (patch: Partial<typeof BLANK_INVITE>) =>
    setInvite((current) => ({ ...current, ...patch }));
  const inviteValid =
    EMAIL.test(invite.email.trim()) &&
    invite.firstName.trim() !== "" &&
    invite.lastName.trim() !== "" &&
    invite.phone.trim().length >= 7 &&
    invite.roleCode !== "";
  const refresh = () => queryClient.invalidateQueries({ queryKey: accessKeys.staff });
  // Staff changes become approval requests, so the pending count and requests list change too.
  const refreshRequests = () => queryClient.invalidateQueries({ queryKey: ["requests"] });
  const roleName = (id: string) => roles.data?.find((r) => r.id === id)?.name ?? id;
  const close = (open: boolean) => !open && setDialog(null);

  // Changes go through a request that another admin approves; ending sessions is immediate.
  const canRequest = can("staff:manage");
  const canRevoke = can("staff:revoke_sessions");
  const canInvite = can("staff:invite");

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("staff.title") }]}
        description={t("staff.description")}
        actions={
          canInvite ? (
            <Button
              onClick={() => {
                setInvite(BLANK_INVITE);
                setInviting(true);
              }}
            >
              <Plus aria-hidden="true" />
              {t("staff.invite")}
            </Button>
          ) : undefined
        }
      />
      {!canRequest && !canRevoke ? (
        <output className="mb-3 block rounded-md bg-warning-bg p-3 text-sm text-warning-text">
          {t("staff.noAccess")}
        </output>
      ) : null}
      <FilterBar
        onClear={() => setFilter("q", "")}
        dirty={filters.q !== ""}
        search={{
          value: filters.q,
          onChange: (v) => setFilter("q", v),
          placeholder: t("staff.search"),
          label: t("staff.searchLabel"),
        }}
      />
      <SectionCard flush>
        <AsyncBody query={staff} isEmpty={(data) => data.total === 0} emptyTitle={t("staff.empty")}>
          {(data) => (
            <DataTable<StaffMember>
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="staff"
              caption={t("staff.title")}
              rows={data.items}
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
                  cell: (r) =>
                    r.invitation ? (
                      <StatusBadge
                        tone={r.invitation === "pending" ? "info" : "warning"}
                        label={
                          r.invitation === "pending" ? t("staff.invited") : t("staff.inviteExpired")
                        }
                      />
                    ) : r.locked ? (
                      <StatusBadge tone="danger" label={t("staff.locked")} />
                    ) : (
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
                  key: "created",
                  header: t("staff.col.created"),
                  sortValue: (r: { createdAt: string | null }) => r.createdAt ?? "",
                  cell: (r) => (r.createdAt ? <DateText iso={r.createdAt} dateOnly /> : "–"),
                },
                {
                  key: "actions",
                  header: t("staff.col.actions"),
                  alwaysVisible: true,
                  align: "right",
                  cell: (r) =>
                    r.id === user.id ? (
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        disabled
                        title={t("staff.self")}
                        aria-label={t("staff.self")}
                      >
                        <DotsThree aria-hidden="true" weight="bold" />
                      </Button>
                    ) : (
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
                          {r.invitation ? (
                            <>
                              <DropdownMenuItem
                                disabled={!canInvite}
                                onSelect={() => setDialog({ kind: "resend", member: r })}
                              >
                                {t("staff.invite.resend")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canInvite}
                                onSelect={() => setDialog({ kind: "revoke-invite", member: r })}
                              >
                                {t("staff.invite.revoke")}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                disabled={!canRequest}
                                onSelect={() => {
                                  setRoleId(r.roleIds[0] ?? "");
                                  setDialog({ kind: "role", member: r });
                                }}
                              >
                                {t("staff.changeRole")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canRequest}
                                onSelect={() => setDialog({ kind: "2fa", member: r })}
                              >
                                {t("staff.reset2fa")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canRequest}
                                onSelect={() => setDialog({ kind: "toggle", member: r })}
                              >
                                {r.active ? t("staff.disable") : t("staff.enable")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canRevoke}
                                onSelect={() => setDialog({ kind: "sessions", member: r })}
                              >
                                {t("staff.revokeSessions")}
                              </DropdownMenuItem>
                            </>
                          )}
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

      <ActionDialog
        open={inviting}
        onOpenChange={(open) => !open && setInviting(false)}
        title={t("staff.invite")}
        impact={t("staff.invite.impact")}
        confirmLabel={t("staff.invite.send")}
        requireReason={false}
        blocked={!inviteValid}
        onConfirm={async () => {
          await inviteStaff(invite);
          await refresh();
          return t("staff.invite.done", { email: invite.email.trim() });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-first">{t("staff.invite.firstName")}</Label>
            <Input
              id="invite-first"
              value={invite.firstName}
              onChange={(e) => setField({ firstName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-last">{t("staff.invite.lastName")}</Label>
            <Input
              id="invite-last"
              value={invite.lastName}
              onChange={(e) => setField({ lastName: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">{t("auth.email")}</Label>
          <Input
            id="invite-email"
            type="email"
            value={invite.email}
            onChange={(e) => setField({ email: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-phone">{t("staff.invite.phone")}</Label>
          <Input
            id="invite-phone"
            type="tel"
            value={invite.phone}
            onChange={(e) => setField({ phone: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">{t("staff.col.roles")}</Label>
          <Select value={invite.roleCode} onValueChange={(v) => setField({ roleCode: v })}>
            <SelectTrigger id="invite-role">
              <SelectValue placeholder={t("staff.invite.pickRole")} />
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

      <InvitationDialog
        mode={
          dialog?.kind === "resend" ? "resend" : dialog?.kind === "revoke-invite" ? "revoke" : null
        }
        member={dialog?.member ?? null}
        roleName={dialog?.member ? dialog.member.roleIds.map(roleName).join(", ") : ""}
        onClose={() => setDialog(null)}
        onDone={refresh}
      />
    </>
  );
}
