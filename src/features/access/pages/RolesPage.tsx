import { Copy, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { retireRole } from "../api/accessApi";
import { accessKeys, useRoles } from "../api/queries";

export function RolesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles = useRoles();
  const [retiring, setRetiring] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <PageHeader
        title={t("roles.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("roles.title") }]}
        description={t("roles.description")}
        actions={
          <Button onClick={() => navigate("/settings/roles/new")}>
            <Plus aria-hidden="true" />
            {t("roles.create")}
          </Button>
        }
      />
      <SectionCard flush>
        <AsyncBody query={roles}>
          {(rows) => (
            <SimpleTable
              caption={t("roles.title")}
              rows={rows}
              getRowId={(r) => r.id}
              columns={[
                {
                  key: "name",
                  header: t("roles.col.name"),
                  sortValue: (r: { name: string }) => r.name,
                  cell: (r) => (
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-text">{r.description}</p>
                    </div>
                  ),
                },
                {
                  key: "perms",
                  header: t("roles.col.permissions"),
                  sortValue: (r: { permissions: unknown[] }) => r.permissions.length,
                  align: "right",
                  cell: (r) => r.permissions.length,
                },
                {
                  key: "members",
                  header: t("roles.col.members"),
                  sortValue: (r: { memberCount: number }) => r.memberCount,
                  align: "right",
                  cell: (r) => r.memberCount,
                },
                {
                  key: "ceiling",
                  header: t("roles.col.ceiling"),
                  sortValue: (r: { approvalCeilingKobo?: number }) => r.approvalCeilingKobo ?? 0,
                  align: "right",
                  cell: (r) =>
                    r.approvalCeilingKobo ? (
                      <MoneyText kobo={r.approvalCeilingKobo} />
                    ) : (
                      t("common.notAvailable")
                    ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (r) => (
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
