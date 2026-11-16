import { WarningCircle } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  MODULE_IDS,
  NAV_ACCESS,
  PERMISSIONS_BY_MODULE,
  canAccess,
  findConflicts,
  moduleLabelKey,
  permissionLabelKey,
  type Permission,
} from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { saveRole } from "../api/accessApi";
import { useRole } from "../api/queries";

export function RoleEditorPage() {
  const { id = "new" } = useParams();
  const [params] = useSearchParams();
  const source = id === "new" ? (params.get("from") ?? "new") : id;
  const query = useRole(source);

  if (source === "new") return <RoleEditor roleId={null} initial={null} />;
  return (
    <AsyncBody query={query}>
      {(role) => (
        <RoleEditor
          roleId={id === "new" ? null : id}
          cloned={id === "new"}
          initial={{
            name: id === "new" ? `${role.name} (copy)` : role.name,
            description: role.description,
            permissions: role.permissions,
            ceilingNaira: String((role.approvalCeilingKobo ?? 0) / 100),
            exempt: role.exemptFromConflicts ?? false,
          }}
        />
      )}
    </AsyncBody>
  );
}

interface Initial {
  name: string;
  description: string;
  permissions: Permission[];
  ceilingNaira: string;
  exempt: boolean;
}

function RoleEditor({
  roleId,
  initial,
  cloned,
}: {
  roleId: string | null;
  initial: Initial | null;
  cloned?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ceiling, setCeiling] = useState(initial?.ceilingNaira ?? "0");
  const [held, setHeld] = useState<Set<Permission>>(new Set(initial?.permissions ?? []));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const conflicts = initial?.exempt ? [] : findConflicts(held);
  const visible = NAV_ACCESS.filter((entry) => canAccess(entry, held));

  function toggle(permission: Permission, on: boolean) {
    setHeld((prev) => {
      const next = new Set(prev);
      if (on) next.add(permission);
      else next.delete(permission);
      return next;
    });
  }

  function toggleModule(permissions: readonly Permission[], on: boolean) {
    setHeld((prev) => {
      const next = new Set(prev);
      permissions.forEach((p) => (on ? next.add(p) : next.delete(p)));
      return next;
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("roles.title"), to: "/settings/roles" }]}
        title={roleId ? t("roles.edit") : cloned ? t("roles.clone") : t("roles.create")}
        actions={
          <Button
            disabled={!name.trim() || held.size === 0 || conflicts.length > 0}
            onClick={() => setConfirmOpen(true)}
          >
            {t("common.save")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <SectionCard title={t("roles.editor.details")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name">{t("roles.col.name")}</Label>
                <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-ceiling">{t("roles.editor.ceiling")}</Label>
                <Input
                  id="role-ceiling"
                  inputMode="decimal"
                  value={ceiling}
                  onChange={(e) => setCeiling(e.target.value)}
                />
                <p className="text-xs text-muted-text">{t("roles.editor.ceilingHint")}</p>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="role-description">{t("roles.editor.description")}</Label>
                <Textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          {conflicts.length > 0 ? (
            <div
              role="alert"
              className="flex gap-2 rounded-lg border border-danger bg-danger-bg p-3 text-sm text-danger-text"
            >
              <WarningCircle aria-hidden="true" weight="fill" className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">{t("roles.editor.conflicts")}</p>
                <ul className="mt-1 list-disc pl-4">
                  {conflicts.map((c) => (
                    <li key={`${c.a}-${c.b}`}>
                      {t(permissionLabelKey(c.a))} + {t(permissionLabelKey(c.b))}: {t(c.reason)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {MODULE_IDS.map((moduleId) => {
            const permissions = PERMISSIONS_BY_MODULE[moduleId];
            const all = permissions.every((p) => held.has(p));
            return (
              <SectionCard
                key={moduleId}
                title={t(moduleLabelKey(moduleId))}
                actions={
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`module-${moduleId}`}
                      checked={all}
                      onChange={(event) => toggleModule(permissions, event.target.checked)}
                    />
                    <Label htmlFor={`module-${moduleId}`}>{t("roles.editor.selectAll")}</Label>
                  </div>
                }
              >
                <ul className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <li key={permission} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${permission}`}
                        checked={held.has(permission)}
                        onChange={(event) => toggle(permission, event.target.checked)}
                      />
                      <Label htmlFor={`perm-${permission}`} className="font-normal">
                        {t(permissionLabelKey(permission))}
                      </Label>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <SectionCard
            title={t("roles.editor.preview")}
            description={t("roles.editor.previewHint")}
          >
            <ul className="flex flex-col gap-1.5 text-base">
              {visible.map((entry) => (
                <li key={entry.id}>{t(entry.label)}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-text">
              {t("roles.editor.count", { count: held.size })}
            </p>
          </SectionCard>
        </aside>
      </div>

      <ActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("roles.save.title")}
        description={name}
        impact={t("roles.save.impact")}
        confirmLabel={t("common.save")}
        onConfirm={async ({ reason }) => {
          await saveRole(
            roleId,
            {
              name: name.trim(),
              description,
              permissions: [...held],
              approvalCeilingKobo: Math.round(Number(ceiling || 0) * 100),
            },
            reason,
          );
          await queryClient.invalidateQueries({ queryKey: ["access"] });
          navigate("/settings/roles");
          return t("roles.saved");
        }}
      />
    </>
  );
}
