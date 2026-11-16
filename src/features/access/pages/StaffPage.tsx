import { DotsThree } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  useCan,
  useCurrentUser,
  ROLE_TEMPLATES,
  findConflicts,
  type Permission,
} from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import {
  assignRoles,
  resetTwoFactor,
  setStaffActive,
  type StaffMember,
  type TwoFactorState,
} from "../api/accessApi";
import { accessKeys, useRoles, useStaff } from "../api/queries";

const TwoFactorBadge = defineStatusBadge<TwoFactorState>({
  enrolled: { tone: "success", label: t("staff.2fa.enrolled") },
  "not-enrolled": { tone: "warning", label: t("staff.2fa.notEnrolled") },
  "reset-pending": { tone: "warning", label: t("staff.2fa.resetPending") },
});

type Dialog = { kind: "roles" | "2fa" | "toggle"; member: StaffMember } | null;

export function StaffPage() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const staff = useStaff();
  const roles = useRoles();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: accessKeys.staff });
  const roleName = (id: string) => roles.data?.find((r) => r.id === id)?.name ?? id;
  const close = (open: boolean) => !open && setDialog(null);

  const chosen = (roles.data ?? []).filter((r) => selected.includes(r.id));
  const union = new Set<Permission>(chosen.flatMap((r) => r.permissions));
  const exempt = chosen.some((r) => r.exemptFromConflicts);
  const conflicts = exempt ? [] : findConflicts(union);

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
                    r.name === user.name || !(can("staff:manage") || can("2fa:reset")) ? null : (
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
                          {can("staff:manage") ? (
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelected(r.roleIds);
                                setDialog({ kind: "roles", member: r });
                              }}
                            >
                              {t("staff.assignRoles")}
                            </DropdownMenuItem>
                          ) : null}
                          {can("2fa:reset") ? (
                            <DropdownMenuItem
                              onSelect={() => setDialog({ kind: "2fa", member: r })}
                            >
                              {t("staff.reset2fa")}
                            </DropdownMenuItem>
                          ) : null}
                          {can("staff:manage") ? (
                            <DropdownMenuItem
                              onSelect={() => setDialog({ kind: "toggle", member: r })}
                            >
                              {r.active ? t("staff.disable") : t("staff.enable")}
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
        open={dialog?.kind === "roles"}
        onOpenChange={close}
        title={t("staff.assignRoles")}
        description={dialog?.member.name}
        impact={t("staff.assign.impact")}
        confirmLabel={t("staff.assignRoles")}
        blocked={selected.length === 0 || conflicts.length > 0}
        onConfirm={async ({ reason }) => {
          if (dialog) await assignRoles(dialog.member.id, selected, user.name, reason);
          await refresh();
          return t("staff.assign.done");
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("staff.col.roles")}</legend>
          {(roles.data ?? ROLE_TEMPLATES).map((role) => (
            <div key={role.id} className="flex items-center gap-2">
              <Checkbox
                id={`assign-${role.id}`}
                checked={selected.includes(role.id)}
                onChange={(event) =>
                  setSelected((prev) =>
                    event.target.checked ? [...prev, role.id] : prev.filter((id) => id !== role.id),
                  )
                }
              />
              <Label htmlFor={`assign-${role.id}`}>{role.name}</Label>
            </div>
          ))}
        </fieldset>
        {conflicts.length > 0 ? (
          <ul role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-text">
            {conflicts.map((c) => (
              <li key={`${c.a}-${c.b}`}>{t(c.reason)}</li>
            ))}
          </ul>
        ) : null}
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
          if (dialog) await resetTwoFactor(dialog.member.id, user.name, reason);
          await refresh();
          return t("staff.reset2fa.done");
        }}
      />

      <ActionDialog
        open={dialog?.kind === "toggle"}
        onOpenChange={close}
        title={dialog?.member.active ? t("staff.disable") : t("staff.enable")}
        description={dialog?.member.name}
        impact={dialog?.member.active ? t("staff.disable.impact") : undefined}
        confirmLabel={dialog?.member.active ? t("staff.disable") : t("staff.enable")}
        destructive={dialog?.member.active}
        onConfirm={async ({ reason }) => {
          if (dialog) await setStaffActive(dialog.member.id, !dialog.member.active, reason);
          await refresh();
          return t("staff.toggle.done");
        }}
      />
    </>
  );
}
