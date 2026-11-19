import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NAV_ACCESS, canAccess, toUiPermissions } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Textarea } from "@/shared/components/ui/Textarea";
import { t } from "@/shared/i18n/t";
import { saveRole, type PermissionDef, type RoleSummary } from "../api/accessApi";
import { useRoleCatalogue } from "../api/queries";

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,39}$/;

export function RoleEditorPage() {
  const { id = "new" } = useParams();
  const [params] = useSearchParams();
  const source = id === "new" ? (params.get("from") ?? "new") : id;
  const query = useRoleCatalogue();

  return (
    <AsyncBody
      query={query}
      isEmpty={(data) => source !== "new" && !data.roles.some((role) => role.id === source)}
    >
      {(data) => (
        <RoleEditor
          roleId={id === "new" ? null : id}
          cloned={id === "new" && source !== "new"}
          role={data.roles.find((role) => role.id === source)}
          permissions={data.permissions}
        />
      )}
    </AsyncBody>
  );
}

/** Groups the permissions a role can hold by the area of the platform they belong to. */
function groupByModule(permissions: PermissionDef[]) {
  const groups = new Map<string, PermissionDef[]>();
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const titleCase = (value: string) =>
  value.replace(/[_-]/g, " ").replace(/^\w/, (first) => first.toUpperCase());

function RoleEditor({
  roleId,
  role,
  cloned,
  permissions,
}: {
  roleId: string | null;
  role: RoleSummary | undefined;
  cloned: boolean;
  permissions: PermissionDef[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState(role ? (cloned ? `${role.name} (copy)` : role.name) : "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [held, setHeld] = useState<Set<string>>(new Set(role?.permissionCodes ?? []));
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Built-in roles keep their permissions; a copy of one is a custom role and can change them.
  const locked = roleId !== null && role?.isSystem === true;
  const visible = NAV_ACCESS.filter((entry) =>
    canAccess(entry, new Set(toUiPermissions([...held]))),
  );
  const codeOk = roleId !== null || CODE_PATTERN.test(code);

  function toggle(permissionCode: string, on: boolean) {
    setHeld((prev) => {
      const next = new Set(prev);
      if (on) next.add(permissionCode);
      else next.delete(permissionCode);
      return next;
    });
  }

  function toggleModule(group: PermissionDef[], on: boolean) {
    setHeld((prev) => {
      const next = new Set(prev);
      group.forEach((p) => (on ? next.add(p.code) : next.delete(p.code)));
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
            disabled={!name.trim() || !codeOk || held.size === 0}
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
                <Label htmlFor="role-code">{t("roles.editor.code")}</Label>
                <Input
                  id="role-code"
                  value={roleId ?? code}
                  disabled={roleId !== null}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-text">{t("roles.editor.codeHint")}</p>
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

          {locked ? (
            <output className="block rounded-md bg-info-bg p-3 text-sm text-info-text">
              {t("roles.editor.systemNote")}
            </output>
          ) : null}

          {groupByModule(permissions).map(([module, group]) => {
            const all = group.every((p) => held.has(p.code));
            return (
              <SectionCard
                key={module}
                title={titleCase(module)}
                actions={
                  locked ? null : (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`module-${module}`}
                        checked={all}
                        onChange={(event) => toggleModule(group, event.target.checked)}
                      />
                      <Label htmlFor={`module-${module}`}>{t("roles.editor.selectAll")}</Label>
                    </div>
                  )
                }
              >
                <ul className="grid gap-2 sm:grid-cols-2">
                  {group.map((permission) => (
                    <li key={permission.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${permission.code}`}
                        checked={held.has(permission.code)}
                        disabled={locked}
                        onChange={(event) => toggle(permission.code, event.target.checked)}
                      />
                      <Label htmlFor={`perm-${permission.code}`} className="font-normal">
                        {permission.description || permission.displayName}
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
            { code, name: name.trim(), description, permissions: [...held] },
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
