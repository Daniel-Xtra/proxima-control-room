import { DotsThree, Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can, useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { ComboInput } from "@/shared/components/ui/ComboInput";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { humanize } from "@/shared/lib/format";
import {
  PROVIDER_NAMES,
  listProviderTypes,
  listProviders,
  requestProviderCreate,
  requestProviderDelete,
  requestProviderStatus,
  type Provider,
} from "../api/providersApi";

const KEY = ["platform-config", "providers"];

type Dialog = { kind: "status" | "delete"; provider: Provider } | "create" | null;

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const [filters, setFilter] = useUrlFilters({ page: "1", limit: "10" });
  const query = useApiQuery(
    [...KEY, filters.page, filters.limit],
    () => listProviders(Number(filters.page), Number(filters.limit)),
    { staleTime: 0, placeholderData: (previous) => previous },
  );
  const types = useApiQuery([...KEY, "types"], listProviderTypes, { staleTime: 60_000 });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const manage = can("provider:manage");
  // Every change is a request, so the approvals inbox changes too.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["requests"] });
    return queryClient.invalidateQueries({ queryKey: KEY });
  };
  const close = (open: boolean) => !open && setDialog(null);
  const target = dialog && dialog !== "create" ? dialog.provider : null;
  const kind = dialog && dialog !== "create" ? dialog.kind : null;

  return (
    <>
      <PageHeader
        title={t("providers.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("providers.title") }]}
        description={t("providers.description")}
        actions={
          <Can permission="provider:manage">
            <Button
              onClick={() => {
                setName("");
                setType("");
                setDialog("create");
              }}
            >
              <Plus aria-hidden="true" />
              {t("providers.add")}
            </Button>
          </Can>
        }
      />
      <SectionCard flush>
        <AsyncBody
          query={query}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("providers.empty")}
        >
          {(data) => (
            <DataTable<Provider>
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="providers"
              caption={t("providers.title")}
              rows={data.items}
              getRowId={(r) => r.id}
              columns={[
                {
                  key: "name",
                  header: t("providers.col.name"),
                  sortValue: (r: { name: string }) => r.name,
                  cell: (r) => <span className="font-medium">{humanize(r.name)}</span>,
                },
                {
                  key: "type",
                  header: t("providers.col.type"),
                  sortValue: (r: { type: string }) => r.type,
                  cell: (r) => humanize(r.type),
                },
                {
                  key: "status",
                  header: t("providers.col.status"),
                  sortValue: (r: { active: boolean }) => String(r.active),
                  cell: (r) => (
                    <BooleanBadge
                      value={r.active}
                      trueLabel={t("providers.active")}
                      falseLabel={t("providers.inactive")}
                    />
                  ),
                },
                {
                  key: "actions",
                  header: t("staff.col.actions"),
                  alwaysVisible: true,
                  align: "right",
                  cell: (r) =>
                    manage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("providers.actionsFor", { name: humanize(r.name) })}
                          >
                            <DotsThree aria-hidden="true" weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onSelect={() => setDialog({ kind: "status", provider: r })}
                          >
                            {r.active ? t("providers.switchOff") : t("providers.switchOn")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={r.active}
                            onSelect={() => setDialog({ kind: "delete", provider: r })}
                          >
                            {t("providers.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <ActionDialog
        open={kind === "status"}
        onOpenChange={close}
        title={target?.active ? t("providers.switchOff") : t("providers.switchOn")}
        description={target ? humanize(target.name) : undefined}
        impact={t("providers.request.impact")}
        confirmLabel={t("providers.request.submit")}
        destructive={target?.active}
        onConfirm={async ({ reason }) => {
          if (!target) return "";
          await requestProviderStatus(target.id, !target.active, reason);
          await refresh();
          return t("providers.request.sent");
        }}
      />

      <ActionDialog
        open={kind === "delete"}
        onOpenChange={close}
        title={t("providers.delete")}
        description={target ? humanize(target.name) : undefined}
        impact={t("providers.delete.impact")}
        confirmLabel={t("providers.request.submit")}
        destructive
        onConfirm={async ({ reason }) => {
          if (!target) return "";
          await requestProviderDelete(target.id, reason);
          await refresh();
          return t("providers.request.sent");
        }}
      />

      <ActionDialog
        open={dialog === "create"}
        onOpenChange={close}
        title={t("providers.add")}
        impact={t("providers.create.impact")}
        confirmLabel={t("providers.request.submit")}
        blocked={name === "" || type.trim() === ""}
        onConfirm={async ({ reason }) => {
          await requestProviderCreate({ name, type: type.trim(), reason });
          await refresh();
          return t("providers.request.sent");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider-name">{t("providers.col.name")}</Label>
          <Select value={name} onValueChange={setName}>
            <SelectTrigger id="provider-name">
              <SelectValue placeholder={t("providers.pick")} />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_NAMES.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanize(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider-type">{t("providers.col.type")}</Label>
          <ComboInput
            id="provider-type"
            value={type}
            onValueChange={setType}
            options={(types.data ?? []).map((value) => ({ value, label: humanize(value) }))}
          />
        </div>
      </ActionDialog>
    </>
  );
}
