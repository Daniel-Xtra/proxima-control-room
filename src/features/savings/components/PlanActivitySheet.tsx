import { ArrowDownLeft, ArrowUpRight } from "@phosphor-icons/react";
import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { MoneyText } from "@/shared/components/MoneyText";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { humanize } from "@/shared/lib/format";
import { usePlanInterest, usePlanTransactions } from "../api/queries";
import type { PlanInterest, PlanTransaction, SavingsPlanRef } from "../model/types";

interface Props {
  plan: SavingsPlanRef | null;
  onClose: () => void;
}

/** Everything that moved on one deposit or savings plan, and the interest added to it. */
export function PlanActivitySheet({ plan, onClose }: Props) {
  const [tab, setTab] = useState("transactions");

  return (
    <DetailsSheet
      open={plan !== null}
      onOpenChange={(open) => !open && onClose()}
      size="xl"
      title={plan?.name || t("savings.activity.title")}
      description={plan ? `${plan.customerName} · ${plan.reference}` : undefined}
    >
      {plan ? (
        <Tabs value={tab} onValueChange={setTab} className="mt-0">
          <TabsList>
            <TabsTrigger value="transactions">{t("savings.activity.tab.transactions")}</TabsTrigger>
            <TabsTrigger value="interest">{t("savings.activity.tab.interest")}</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <TransactionsPanel plan={plan} />
          </TabsContent>
          <TabsContent value="interest">
            <InterestPanel plan={plan} />
          </TabsContent>
        </Tabs>
      ) : null}
    </DetailsSheet>
  );
}

function TransactionsPanel({ plan }: { plan: SavingsPlanRef }) {
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = usePlanTransactions(plan.kind, plan.id, paging.page, paging.limit);

  return (
    <AsyncBody
      query={result}
      isEmpty={(data) => data.total === 0}
      emptyTitle={t("savings.activity.empty.transactions")}
    >
      {(data) => (
        <DataTable<PlanTransaction>
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
          onLimitChange={(limit) => setPaging({ page: 1, limit })}
          storageKey="savings-activity-transactions"
          caption={t("savings.activity.tab.transactions")}
          rows={data.items}
          getRowId={(r) => r.reference}
          columns={[
            {
              key: "date",
              header: t("savings.activity.col.date"),
              cell: (r) => <DateText iso={r.at} />,
            },
            {
              key: "type",
              header: t("savings.activity.col.type"),
              cell: (r) => (
                <div>
                  <p className="font-medium capitalize">{humanize(r.purpose)}</p>
                  {r.description ? (
                    <p className="text-xs text-muted-text">{r.description}</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "direction",
              header: t("savings.activity.col.channel"),
              cell: (r) => <span className="capitalize">{humanize(r.channel)}</span>,
            },
            {
              key: "reference",
              header: t("savings.activity.col.reference"),
              cell: (r) => <span className="tabular text-xs">{r.reference}</span>,
            },
            {
              key: "amount",
              header: t("savings.activity.col.amount"),
              align: "right",
              cell: (r) => (
                <span
                  className={`inline-flex items-center gap-1 font-medium ${r.direction === "inflow" ? "text-success" : "text-warning-text"}`}
                >
                  {r.direction === "inflow" ? (
                    <ArrowDownLeft aria-hidden="true" size={14} />
                  ) : (
                    <ArrowUpRight aria-hidden="true" size={14} />
                  )}
                  <span className="sr-only">
                    {r.direction === "inflow"
                      ? t("savings.activity.in")
                      : t("savings.activity.out")}
                  </span>
                  <MoneyText kobo={r.amountKobo} />
                </span>
              ),
            },
          ]}
        />
      )}
    </AsyncBody>
  );
}

function InterestPanel({ plan }: { plan: SavingsPlanRef }) {
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = usePlanInterest(plan.kind, plan.id, paging.page, paging.limit);

  return (
    <AsyncBody
      query={result}
      isEmpty={(data) => data.total === 0}
      emptyTitle={t("savings.activity.empty.interest")}
    >
      {(data) => (
        <DataTable<PlanInterest>
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
          onLimitChange={(limit) => setPaging({ page: 1, limit })}
          storageKey="savings-activity-interest"
          caption={t("savings.activity.tab.interest")}
          rows={data.items}
          getRowId={(r) => r.date}
          columns={[
            {
              key: "date",
              header: t("savings.activity.col.interestDate"),
              cell: (r) => <DateText iso={r.date} dateOnly />,
            },
            {
              key: "amount",
              header: t("savings.activity.col.amount"),
              align: "right",
              cell: (r) => <MoneyText kobo={r.amountKobo} />,
            },
            {
              key: "credited",
              header: t("savings.activity.col.credited"),
              cell: (r) =>
                r.creditedAt ? (
                  <DateText iso={r.creditedAt} />
                ) : (
                  <StatusBadge tone="warning" label={t("savings.activity.pending")} />
                ),
            },
          ]}
        />
      )}
    </AsyncBody>
  );
}
