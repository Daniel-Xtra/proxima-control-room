import { Heartbeat, Wrench } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { formatCount, maskTail } from "@/shared/lib/format";
import {
  bulkRepair,
  getBankOneOverview,
  listMissingAccounts,
  repairSingle,
  runHealthCheck,
  type MissingAccount,
  type RepairResult,
} from "../api/bankOneApi";

const KEYS = { overview: ["bankone", "overview"], missing: ["bankone", "missing"] };

export function BankOneRepairPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const canRepair = can("customer:repair_bankone");
  const overview = useApiQuery(KEYS.overview, getBankOneOverview);
  const missing = useApiQuery(KEYS.missing, listMissingAccounts);
  const [results, setResults] = useState<RepairResult[]>();
  const [dryRun, setDryRun] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [single, setSingle] = useState<MissingAccount | null>(null);
  const health = useMutation({
    mutationFn: runHealthCheck,
    onSuccess: (result) => toast.success(t("bankone.health.ok", { ms: result.latencyMs })),
  });
  const checking = health.isPending;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["bankone"] });

  return (
    <>
      <PageHeader
        title={t("bankone.title")}
        crumbs={[{ label: t("nav.group.system") }, { label: t("bankone.title") }]}
        description={t("bankone.description")}
        actions={
          <>
            <Button variant="outline" disabled={checking} onClick={() => health.mutate()}>
              <Heartbeat aria-hidden="true" />
              {checking ? t("common.working") : t("bankone.health.run")}
            </Button>
            {canRepair ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDryRun(true);
                    setBulkOpen(true);
                  }}
                >
                  {t("bankone.dryRun")}
                </Button>
                <Button
                  onClick={() => {
                    setDryRun(false);
                    setBulkOpen(true);
                  }}
                >
                  {t("bankone.bulkRepair")}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <AsyncBody query={overview} skeletonRows={2}>
          {(data) => (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t("bankone.stats.checked")}
                value={formatCount(data.customersChecked)}
              />
              <StatCard
                label={t("bankone.stats.missing")}
                value={data.missingAccounts}
                tone={data.missingAccounts > 0 ? "warning" : "default"}
              />
              <StatCard
                label={t("bankone.stats.queued")}
                value={data.queued ?? t("common.notAvailable")}
              />
            </div>
          )}
        </AsyncBody>

        {results ? (
          <SectionCard
            title={dryRun ? t("bankone.results.dryRun") : t("bankone.results.title")}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setResults(undefined)}>
                {t("common.dismiss")}
              </Button>
            }
            flush
          >
            <SimpleTable<RepairResult>
              storageKey="bankone-results"
              caption={t("bankone.results.title")}
              rows={results}
              getRowId={(r) => r.customerId}
              columns={[
                { key: "name", header: t("bankone.col.customer"), cell: (r) => r.customerName },
                {
                  key: "outcome",
                  header: t("bankone.col.outcome"),
                  cell: (r) => (
                    <StatusBadge
                      tone={
                        r.outcome === "failed"
                          ? "danger"
                          : r.outcome === "created"
                            ? "success"
                            : "info"
                      }
                      label={t(`bankone.outcome.${r.outcome}`)}
                    />
                  ),
                },
              ]}
            />
          </SectionCard>
        ) : null}

        <SectionCard
          title={t("bankone.missing.title")}
          description={t("bankone.missing.description")}
          flush
        >
          <AsyncBody
            query={missing}
            isEmpty={(rows) => rows.length === 0}
            emptyTitle={t("bankone.missing.empty")}
          >
            {(rows) => (
              <SimpleTable<MissingAccount>
                storageKey="bankone-missing"
                caption={t("bankone.missing.title")}
                rows={rows}
                getRowId={(r) => r.customerId}
                columns={[
                  { key: "name", header: t("bankone.col.customer"), cell: (r) => r.customerName },
                  {
                    key: "phone",
                    header: t("customers.col.phone"),
                    cell: (r) => maskTail(r.phone, 3),
                  },
                  {
                    key: "queue",
                    header: t("bankone.col.queue"),
                    cell: (r) => (
                      <StatusBadge
                        tone={r.queued ? "info" : "neutral"}
                        label={
                          r.queued === null
                            ? t("common.notAvailable")
                            : r.queued
                              ? t("bankone.queued")
                              : t("bankone.notQueued")
                        }
                      />
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    align: "right",
                    cell: (r) =>
                      canRepair ? (
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("bankone.repairNamed", { name: r.customerName })}
                          onClick={() => setSingle(r)}
                        >
                          <Wrench aria-hidden="true" />
                        </Button>
                      ) : null,
                  },
                ]}
              />
            )}
          </AsyncBody>
        </SectionCard>
      </div>

      <ActionDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={dryRun ? t("bankone.dryRun") : t("bankone.bulkRepair")}
        impact={dryRun ? t("bankone.dryRun.impact") : t("bankone.bulk.impact")}
        confirmLabel={dryRun ? t("bankone.dryRun") : t("bankone.bulkRepair")}
        requireTotp={!dryRun}
        onConfirm={async ({ reason }) => {
          setResults(await bulkRepair(dryRun, reason));
          await refresh();
          return dryRun ? t("bankone.dryRun.done") : t("bankone.bulk.done");
        }}
      />
      <ActionDialog
        open={single !== null}
        onOpenChange={(open) => !open && setSingle(null)}
        title={t("bankone.repairOne")}
        description={single?.customerName}
        impact={t("customers.repair.impact")}
        confirmLabel={t("bankone.repairOne")}
        onConfirm={async ({ reason }) => {
          if (single) await repairSingle(single.customerId, reason);
          await refresh();
          return t("bankone.repaired");
        }}
      />
    </>
  );
}
