import { MagnifyingGlass } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NAV_ACCESS, canAccess, toUiPermissions } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Switch } from "@/shared/components/ui/Switch";
import { Textarea } from "@/shared/components/ui/Textarea";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { saveRole, type PermissionDef, type RoleSummary } from "../api/accessApi";
import { useRoleCatalogue } from "../api/queries";
import { moduleLabel } from "../model/moduleLabels";

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,39}$/;

/** "Disputes Lead" becomes DISPUTES_LEAD. Accents are dropped and anything else becomes an underscore. */
function roleCodeFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^[^A-Z]+/, "")
    .replace(/_+$/, "")
    .slice(0, 40)
    .replace(/_+$/, "");
}

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

/**
 * The order permissions are listed in: viewing first, then each action with its "ask" right before its "approve".
 * (The codes sort alphabetically, which puts "approve" before "request" and "view" last.)
 */
function listOrder(code: string): [number, string, number] {
  const parts = code.split(".").slice(1);
  const last = parts[parts.length - 1] ?? "";
  const kind = last === "request" ? 0 : last === "approve" ? 1 : 0;
  const base = (kind === 1 || last === "request" ? parts.slice(0, -1) : parts).join(".");
  const viewing = /(^|.)view/.test(base) ? 0 : 1;
  return [viewing, base, kind];
}

function byListOrder(a: PermissionDef, b: PermissionDef) {
  const [aView, aBase, aKind] = listOrder(a.code);
  const [bView, bBase, bKind] = listOrder(b.code);
  return aView - bView || aBase.localeCompare(bBase) || aKind - bKind;
}

/** Groups the permissions a role can hold by the area of the platform they belong to. */
function groupByModule(permissions: PermissionDef[]) {
  const groups = new Map<string, PermissionDef[]>();
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
  }
  return [...groups.entries()]
    .map(([module, group]) => [module, group.sort(byListOrder)] as [string, PermissionDef[]])
    .sort(([a], [b]) => moduleLabel(a).localeCompare(moduleLabel(b)));
}

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
  const [name, setName] = useState(role ? (cloned ? `${role.name} (copy)` : role.name) : "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [held, setHeld] = useState<Set<string>>(new Set(role?.permissionCodes ?? []));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const modules = groupByModule(permissions);
  const [active, setActive] = useState(modules[0]?.[0] ?? "");

  // Built-in roles keep their permissions; a copy of one is a custom role and can change them.
  const locked = roleId !== null && role?.isSystem === true;
  const visible = NAV_ACCESS.filter((entry) =>
    canAccess(entry, new Set(toUiPermissions([...held]))),
  );
  // The code is made from the name when the role is created, and never changes afterwards.
  const code = roleId ?? roleCodeFromName(name);
  const codeOk = roleId !== null || CODE_PATTERN.test(code);
  const title = roleId ? (role?.name ?? roleId) : cloned ? t("roles.clone") : t("roles.create");
  const share = permissions.length ? Math.round((held.size / permissions.length) * 100) : 0;

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

  // A search looks across every area; otherwise the chosen area is shown.
  const needle = query.trim().toLowerCase();
  const searching = needle !== "";
  const activeGroup = modules.find(([module]) => module === active)?.[1] ?? [];
  const matches = (p: PermissionDef) =>
    (!selectedOnly || held.has(p.code)) &&
    (!searching ||
      p.description.toLowerCase().includes(needle) ||
      moduleLabel(p.module).toLowerCase().includes(needle));
  const rows = (searching ? modules.flatMap(([, group]) => group) : activeGroup).filter(matches);
  const activeHeld = activeGroup.filter((p) => held.has(p.code)).length;

  // What is still needed before Save turns on, so a disabled button is never a mystery.
  const missing = [
    !name.trim() ? t("roles.editor.missingName") : null,
    !codeOk ? t("roles.editor.missingCode") : null,
    held.size === 0 ? t("roles.editor.missingPermission") : null,
  ].filter((item): item is string => item !== null);

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("roles.title"), to: "/settings/roles" }, { label: title }]}
        title={title}
        description={roleId ? role?.description : undefined}
        meta={locked ? <StatusBadge tone="neutral" label={t("roles.system")} /> : undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/settings/roles")}>
              {t("common.cancel")}
            </Button>
            <Button disabled={missing.length > 0} onClick={() => setConfirmOpen(true)}>
              {t("common.save")}
            </Button>
          </>
        }
      />

      {missing.length > 0 ? (
        <output className="mb-4 block rounded-md bg-info-bg p-3 text-sm text-info-text">
          {t("roles.editor.missing", { what: missing.join(", ") })}
        </output>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          {locked ? (
            <output className="block rounded-md bg-info-bg p-3 text-sm text-info-text">
              {t("roles.editor.systemNote")}
            </output>
          ) : null}

          <SectionCard title={t("roles.editor.details")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name">{t("roles.col.name")}</Label>
                <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-code">{t("roles.editor.code")}</Label>
                <Input id="role-code" value={code} readOnly disabled />
                <p className="m-0 text-xs text-muted-text">{t("roles.editor.codeHint")}</p>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="role-description">{t("roles.editor.description")}</Label>
                <Textarea
                  id="role-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t("roles.editor.access")}
            description={t("roles.editor.accessHint")}
            flush
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-border-soft p-4">
              <div className="relative min-w-56 flex-1">
                <Input
                  type="search"
                  aria-label={t("roles.editor.searchPermissions")}
                  placeholder={t("roles.editor.searchPermissions")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pr-10"
                />
                <MagnifyingGlass
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-text"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="selected-only"
                  checked={selectedOnly}
                  onCheckedChange={setSelectedOnly}
                />
                <Label htmlFor="selected-only" className="font-normal">
                  {t("roles.editor.selectedOnly")}
                </Label>
              </div>
            </div>

            {/* From md up the two columns share one height that follows the window, and each scrolls on its own. */}
            <div className="grid grid-cols-1 md:h-[clamp(24rem,72vh,48rem)] md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
              <nav
                aria-label={t("roles.editor.areas")}
                className="flex gap-1 overflow-x-auto border-b border-border-soft p-2 md:min-h-0 md:flex-col md:overflow-y-auto md:border-r md:border-b-0"
              >
                {modules.map(([module, group]) => {
                  const count = group.filter((p) => held.has(p.code)).length;
                  const current = !searching && module === active;
                  return (
                    <button
                      key={module}
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => {
                        setQuery("");
                        setActive(module);
                      }}
                      className={cn(
                        "flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        current
                          ? "bg-info-bg font-medium text-info-text"
                          : "text-ink hover:bg-surface-muted",
                      )}
                    >
                      <span className="truncate">{moduleLabel(module)}</span>
                      <span
                        className={cn(
                          "tabular text-xs",
                          count > 0 && !current ? "text-ink" : "text-muted-text",
                        )}
                      >
                        {count}/{group.length}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="min-h-0 min-w-0 md:overflow-y-auto">
                <div className="flex items-center justify-between gap-3 border-b border-border-soft bg-card px-4 py-3 md:sticky md:top-0 md:z-10">
                  <h3 className="m-0 text-sm font-semibold text-ink">
                    {searching ? t("roles.editor.results") : moduleLabel(active)}
                    <span className="tabular ml-2 text-xs font-normal text-muted-text">
                      {searching
                        ? rows.length
                        : t("roles.editor.stat.of", {
                            count: activeHeld,
                            total: activeGroup.length,
                          })}
                    </span>
                  </h3>
                  {locked || searching ? null : (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={activeHeld === activeGroup.length}
                        onChange={(event) => toggleModule(activeGroup, event.target.checked)}
                      />
                      <Label htmlFor="select-all" className="font-normal">
                        {t("roles.editor.selectAll")}
                      </Label>
                    </div>
                  )}
                </div>

                {rows.length === 0 ? (
                  <p className="m-0 p-6 text-center text-sm text-muted-text">
                    {t("roles.editor.noMatch")}
                  </p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {rows.map((permission) => (
                      <li
                        key={permission.code}
                        className="border-b border-border-soft last:border-b-0"
                      >
                        <label
                          htmlFor={`perm-${permission.code}`}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm text-ink",
                            locked ? "" : "cursor-pointer hover:bg-surface-muted",
                          )}
                        >
                          <Checkbox
                            id={`perm-${permission.code}`}
                            checked={held.has(permission.code)}
                            disabled={locked}
                            onChange={(event) => toggle(permission.code, event.target.checked)}
                          />
                          <span className="min-w-0">
                            {permission.description || t("roles.editor.noDescription")}
                            {searching ? (
                              <span className="block text-xs text-muted-text">
                                {moduleLabel(permission.module)}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <SectionCard title={t("roles.editor.summary")}>
            <p className="m-0 flex items-baseline gap-1.5">
              <span className="tabular font-heading text-2xl font-semibold text-ink">
                {held.size}
              </span>
              <span className="text-sm text-muted-text">
                {t("roles.editor.ofTotal", { total: permissions.length })}
              </span>
            </p>
            {/* The figures above say the same thing, so the bar is decoration. */}
            <div
              aria-hidden="true"
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
            </div>
            <dl className="m-0 mt-4 flex items-center justify-between text-sm">
              <dt className="text-muted-text">{t("roles.editor.stat.staff")}</dt>
              <dd className="tabular m-0 font-medium text-ink">
                {roleId ? (role?.memberCount ?? 0) : "–"}
              </dd>
            </dl>
          </SectionCard>

          <SectionCard
            title={t("roles.editor.preview")}
            description={t("roles.editor.previewHint")}
          >
            {visible.length === 0 ? (
              <p className="m-0 text-sm text-muted-text">{t("roles.editor.previewEmpty")}</p>
            ) : (
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {visible.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink"
                  >
                    {t(entry.label)}
                  </li>
                ))}
              </ul>
            )}
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
