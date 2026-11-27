import { useState } from "react";
import { useCan } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { MoneyText } from "@/shared/components/MoneyText";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import type { SavingsFilters } from "../api/savingsApi";
import { useFixedDeposits, useTargetSavings } from "../api/queries";
import type {
  FixedDeposit,
  SavingsPlanRef,
  FixedDepositStatus,
  TargetSaving,
  TargetSavingStatus,
} from "../model/types";
import { LiquidateDialog, type LiquidationTarget } from "./LiquidateDialog";
import { PlanActivitySheet } from "./PlanActivitySheet";

const FixedBadge = defineStatusBadge<FixedDepositStatus>({
  active: { tone: "info", label: t("savings.status.active") },
  matured: { tone: "warning", label: t("savings.status.matured") },
  cancelled: { tone: "neutral", label: t("savings.status.cancelled") },
  paid: { tone: "success", label: t("savings.status.paid") },
});

const TargetBadge = defineStatusBadge<TargetSavingStatus>({
  active: { tone: "info", label: t("savings.status.active") },
  cancelled: { tone: "neutral", label: t("savings.status.cancelled") },
  matured: { tone: "warning", label: t("savings.status.matured") },
  paid: { tone: "success", label: t("savings.status.paid") },
});

export function FixedDepositsTable({
  customerId,
  filters,
}: {
  customerId?: string;
  filters?: SavingsFilters;
}) {
  const can = useCan();
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = useFixedDeposits(customerId, filters, paging.page, paging.limit);
  const [target, setTarget] = useState<LiquidationTarget | null>(null);
  const [viewing, setViewing] = useState<SavingsPlanRef | null>(null);

  return (
    <>
      <AsyncBody
        query={result}
        isEmpty={(data) => data.total === 0}
        emptyTitle={t("savings.empty")}
      >
        {(data) => (
          <DataTable<FixedDeposit>
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
            onLimitChange={(limit) => setPaging({ page: 1, limit })}
            onRowOpen={(r) =>
              setViewing({
                kind: "fixed",
                id: r.id,
                name: r.name,
                reference: r.reference,
                customerName: r.customerName,
              })
            }
            storageKey="fixed-deposits"
            caption={t("savings.tab.fixed")}
            rows={data.items}
            getRowId={(r) => r.id}
            columns={[
              {
                key: "name",
                header: t("savings.col.plan"),
                sortValue: (r: { name: string }) => r.name,
                cell: (r: FixedDeposit) => (
                  <div>
                    <p className="font-medium">{r.name || t("common.notAvailable")}</p>
                    {r.reference ? <p className="text-xs text-muted-text">{r.reference}</p> : null}
                  </div>
                ),
              },
              ...(customerId
                ? []
                : [
                    {
                      key: "customer",
                      header: t("savings.col.customer"),
                      sortValue: (r: { customerName: string }) => r.customerName,
                      cell: (r: FixedDeposit) => r.customerName,
                    },
                  ]),
              {
                key: "principal",
                header: t("savings.col.principal"),
                sortValue: (r: { principalKobo: number }) => r.principalKobo,
                align: "right",
                cell: (r) => <MoneyText kobo={r.principalKobo} />,
              },
              {
                key: "rate",
                header: t("savings.col.rate"),
                sortValue: (r: { interestRatePercent: number }) => r.interestRatePercent,
                cell: (r) => `${r.interestRatePercent}%`,
              },
              {
                key: "duration",
                header: t("savings.col.duration"),
                sortValue: (r: { durationDays: number }) => r.durationDays,
                cell: (r) => t("savings.days", { count: r.durationDays }),
              },
              {
                key: "matures",
                header: t("savings.col.maturity"),
                sortValue: (r: { maturesAt: string }) => r.maturesAt,
                cell: (r) => <DateText iso={r.maturesAt} dateOnly />,
              },
              {
                key: "status",
                header: t("savings.col.status"),
                sortValue: (r: { status: string }) => r.status,
                cell: (r) => <FixedBadge status={r.status} />,
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (r) =>
                  r.status === "active" && can("savings:liquidate") ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        setTarget({ id: r.id, kind: "fixed", customerName: r.customerName })
                      }
                    >
                      {t("savings.liquidate.action")}
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
      </AsyncBody>
      <LiquidateDialog target={target} onClose={() => setTarget(null)} />
      <PlanActivitySheet
        key={viewing?.id ?? "none"}
        plan={viewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}

export function TargetSavingsTable({
  customerId,
  filters,
}: {
  customerId?: string;
  filters?: SavingsFilters;
}) {
  const can = useCan();
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = useTargetSavings(customerId, filters, paging.page, paging.limit);
  const [target, setTarget] = useState<LiquidationTarget | null>(null);
  const [viewing, setViewing] = useState<SavingsPlanRef | null>(null);

  return (
    <>
      <AsyncBody
        query={result}
        isEmpty={(data) => data.total === 0}
        emptyTitle={t("savings.empty")}
      >
        {(data) => (
          <DataTable<TargetSaving>
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
            onLimitChange={(limit) => setPaging({ page: 1, limit })}
            onRowOpen={(r) =>
              setViewing({
                kind: "target",
                id: r.id,
                name: r.name,
                reference: r.reference,
                customerName: r.customerName,
              })
            }
            storageKey="target-savings"
            caption={t("savings.tab.target")}
            rows={data.items}
            getRowId={(r) => r.id}
            columns={[
              ...(customerId
                ? []
                : [
                    {
                      key: "customer",
                      header: t("savings.col.customer"),
                      sortValue: (r: { customerName: string }) => r.customerName,
                      cell: (r: TargetSaving) => r.customerName,
                    },
                  ]),
              { key: "name", header: t("savings.col.plan"), cell: (r) => r.name },
              {
                key: "target",
                header: t("savings.col.target"),
                sortValue: (r: { targetKobo: number }) => r.targetKobo,
                align: "right",
                cell: (r) => <MoneyText kobo={r.targetKobo} />,
              },
              {
                key: "saved",
                header: t("savings.col.saved"),
                sortValue: (r: { savedKobo: number }) => r.savedKobo,
                align: "right",
                cell: (r) => <MoneyText kobo={r.savedKobo} />,
              },
              {
                key: "freq",
                header: t("savings.col.frequency"),
                sortValue: (r: { frequency: string }) => r.frequency,
                cell: (r) => t(`savings.frequency.${r.frequency}`),
              },
              {
                key: "status",
                header: t("savings.col.status"),
                sortValue: (r: { status: string }) => r.status,
                cell: (r) => <TargetBadge status={r.status} />,
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (r) =>
                  r.status === "active" && can("savings:liquidate") ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        setTarget({ id: r.id, kind: "target", customerName: r.customerName })
                      }
                    >
                      {t("savings.liquidate.action")}
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
      </AsyncBody>
      <LiquidateDialog target={target} onClose={() => setTarget(null)} />
      <PlanActivitySheet
        key={viewing?.id ?? "none"}
        plan={viewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
