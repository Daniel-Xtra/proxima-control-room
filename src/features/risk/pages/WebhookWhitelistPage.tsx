import { Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can, useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import {
  addWhitelistEntry,
  listWhitelist,
  removeWhitelistEntry,
  type WhitelistEntry,
} from "../api/riskApi";

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

export function WebhookWhitelistPage() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const query = useApiQuery(["risk", "whitelist"], listWhitelist);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<WhitelistEntry | null>(null);
  const [service, setService] = useState("");
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["risk", "whitelist"] });

  return (
    <>
      <PageHeader
        title={t("whitelist.title")}
        crumbs={[{ label: t("nav.group.risk") }, { label: t("whitelist.title") }]}
        description={t("whitelist.description")}
        actions={
          <Can permission="integrations:manage">
            <Button onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" />
              {t("whitelist.add")}
            </Button>
          </Can>
        }
      />
      <AsyncBody
        query={query}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={t("whitelist.empty")}
      >
        {(rows) => {
          const byService = rows.reduce<Record<string, number>>(
            (acc, row) => ({ ...acc, [row.service]: (acc[row.service] ?? 0) + 1 }),
            {},
          );
          return (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label={t("whitelist.stats.total")} value={rows.length} />
                <StatCard
                  label={t("whitelist.stats.services")}
                  value={Object.keys(byService).length}
                />
              </div>
              <SectionCard flush>
                <SimpleTable<WhitelistEntry>
                  caption={t("whitelist.title")}
                  rows={rows}
                  getRowId={(r) => r.id}
                  columns={[
                    { key: "service", header: t("whitelist.col.service"), cell: (r) => r.service },
                    {
                      key: "ip",
                      header: t("audit.ip"),
                      sortValue: (r: { ip: string }) => r.ip,
                      cell: (r) => <span className="tabular">{r.ip}</span>,
                    },
                    { key: "note", header: t("whitelist.col.note"), cell: (r) => r.note },
                    { key: "by", header: t("whitelist.col.addedBy"), cell: (r) => r.addedBy },
                    {
                      key: "at",
                      header: t("whitelist.col.addedAt"),
                      sortValue: (r: { addedAt: string }) => r.addedAt,
                      cell: (r) => <DateText iso={r.addedAt} dateOnly />,
                    },
                    {
                      key: "actions",
                      header: "",
                      align: "right",
                      cell: (r) =>
                        can("integrations:manage") ? (
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("whitelist.removeNamed", { ip: r.ip })}
                            onClick={() => setRemoving(r)}
                          >
                            <Trash aria-hidden="true" />
                          </Button>
                        ) : null,
                    },
                  ]}
                />
              </SectionCard>
            </div>
          );
        }}
      </AsyncBody>

      <ActionDialog
        open={adding}
        onOpenChange={setAdding}
        title={t("whitelist.add")}
        impact={t("whitelist.addImpact")}
        confirmLabel={t("whitelist.add")}
        blocked={!service.trim() || !IPV4.test(ip)}
        onConfirm={async ({ reason }) => {
          await addWhitelistEntry({ service, ip, note }, user.name, reason);
          await refresh();
          setService("");
          setIp("");
          setNote("");
          return t("whitelist.added");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-service">{t("whitelist.col.service")}</Label>
          <Input id="wl-service" value={service} onChange={(e) => setService(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-ip">{t("audit.ip")}</Label>
          <Input
            id="wl-ip"
            inputMode="decimal"
            placeholder="102.89.34.17"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            aria-invalid={ip !== "" && !IPV4.test(ip)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-note">{t("whitelist.col.note")}</Label>
          <Input id="wl-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("whitelist.remove")}
        description={removing ? `${removing.service} · ${removing.ip}` : undefined}
        impact={t("whitelist.removeImpact")}
        confirmLabel={t("whitelist.remove")}
        typedConfirmation
        destructive
        onConfirm={async ({ reason }) => {
          if (removing) await removeWhitelistEntry(removing.id, reason);
          await refresh();
          return t("whitelist.removed");
        }}
      />
    </>
  );
}
