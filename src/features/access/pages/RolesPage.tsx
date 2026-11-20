import { Copy, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { retireRole } from "../api/accessApi";
import { accessKeys, useRolesPage } from "../api/queries";

export function RolesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilter] = useUrlFilters({ q: "", page: "1", limit: "10" });
  const roles = useRolesPage(Number(filters.page), Number(filters.limit), filters.q);
  const canManage = useCan()("roles:manage");
  const [retiring, setRetiring] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <PageHeader
        title={t("roles.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("roles.title") }]}
        description={t("roles.description")}
        actions={
          canManage ? (
            <Button onClick={() => navigate("/settings/roles/new")}>
              <Plus aria-hidden="true" />
              {t("roles.create")}
            </Button>
          ) : null
        }
      />
      <FilterBar
        onClear={() => setFilter("q", "")}
        dirty={filters.q !== ""}
        search={{
          value: filters.q,
          onChange: (v) => setFilter("q", v),
          placeholder: t("roles.search"),
          label: t("roles.searchLabel"),
        }}
      />
      <SectionCard flush>
        <AsyncBody query={roles} isEmpty={(data) => data.total === 0}>
          {(data) => (
            <DataTable
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="roles"
              caption={t("roles.title")}
              rows={data.items}
              getRowId={(r) => r.id}
              columns={[
                {
                  key: "name",
                  header: t("roles.col.name"),
                  sortValue: (r: { name: string }) => r.name,
                  cell: (r) => (
                    <div>
                      <p className="font-medium">
                        {r.name}
                        {r.isSystem ? (
                          <span className="ml-2 text-xs font-normal text-muted-text">
                            {t("roles.system")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-text">{r.description}</p>
                    </div>
                  ),
                },
                {
                  key: "perms",
                  header: t("roles.col.permissions"),
                  sortValue: (r: { permissionCodes: unknown[] }) => r.permissionCodes.length,
                  align: "right",
                  cell: (r) => r.permissionCodes.length,
                },
                {
                  key: "members",
                  header: t("roles.col.members"),
                  sortValue: (r: { memberCount: number }) => r.memberCount,
                  align: "right",
                  cell: (r) => r.memberCount,
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    !canManage ? null : (
                      <span className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("roles.editNamed", { name: r.name })}
                          onClick={() => navigate(`/settings/roles/${r.id}`)}
                        >
                          <PencilSimple aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("roles.cloneNamed", { name: r.name })}
                          onClick={() => navigate(`/settings/roles/new?from=${r.id}`)}
                        >
                          <Copy aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("roles.retireNamed", { name: r.name })}
                          disabled={r.isSystem}
                          onClick={() => setRetiring({ id: r.id, name: r.name })}
                        >
                          <Trash aria-hidden="true" />
                        </Button>
                      </span>
                    ),
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
      <ActionDialog
        open={retiring !== null}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={t("roles.retire")}
        description={retiring?.name}
        impact={t("roles.retire.impact")}
        confirmLabel={t("roles.retire")}
        typedConfirmation
        destructive
        onConfirm={async ({ reason }) => {
          if (retiring) await retireRole(retiring.id, reason);
          await queryClient.invalidateQueries({ queryKey: accessKeys.roles });
          return t("roles.retired");
        }}
      />
    </>
  );
}
