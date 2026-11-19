import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { isBatchActive, useBatchItems } from "../api/queries";
import type { BulkBatch, BulkItem, ItemStatus } from "../model/types";
import { ItemStatusBadge } from "./BulkBadges";

type Filter = ItemStatus | "all";

/** The states worth filtering on, in the order a payout moves through them. */
const FILTERS: Filter[] = ["all", "success", "failed", "pending", "processing", "unknown"];

/** The batch's payees, a page at a time, with a filter by payout state. */
export function BatchPayeesTable({ batch }: { batch: BulkBatch }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = useBatchItems(
    batch.id,
    { ...paging, status: filter },
    isBatchActive(batch.status),
  );

  const countOf = (id: Filter) => (id === "all" ? batch.itemCount : batch.counts[id]);
  // A state nobody is in is not worth a tab, except the one being viewed.
  const visible = FILTERS.filter((id) => id === "all" || id === filter || countOf(id) > 0);

  return (
    <SectionCard title={t("bulk.section.payees")} flush>
      <div className="overflow-x-auto border-b border-border-soft px-4 py-3">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as Filter);
            setPaging((current) => ({ ...current, page: 1 }));
          }}
          className="mt-0 gap-0"
        >
          <TabsList className="w-auto gap-1 rounded-lg border border-border bg-surface-muted p-1">
            {visible.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                className="mb-0 gap-2 rounded-md border-b-0 px-3 py-1.5 text-muted-text data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm"
              >
                {id === "all" ? t("bulk.filter.all") : t(`bulk.item.${id}`)}
                <span className="tabular rounded-full bg-surface-muted px-1.5 text-xs text-muted-text">
                  {countOf(id)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <AsyncBody
        query={result}
        isEmpty={(data) => data.total === 0}
        emptyTitle={t("bulk.payees.empty")}
      >
        {(data) => (
          <DataTable<BulkItem>
            storageKey="bulk-items"
            cardsOnSmall={false}
            caption={t("bulk.section.payees")}
            rows={data.items}
            getRowId={(item) => item.id}
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={(page) => setPaging((current) => ({ ...current, page }))}
            onLimitChange={(limit) => setPaging({ page: 1, limit })}
            columns={[
              { key: "row", header: t("bulk.col.row"), cell: (i) => i.row },
              {
                key: "name",
                primary: true,
                header: t("bulk.col.accountName"),
                cell: (i) => <span className="font-medium">{i.accountName}</span>,
              },
              {
                key: "account",
                header: t("bulk.col.accountNumber"),
                cell: (i) => <span className="tabular">{i.accountNumber}</span>,
              },
              { key: "bank", header: t("bulk.col.bank"), cell: (i) => i.bank },
              {
                key: "amount",
                header: t("bulk.col.amount"),
                align: "right",
                cell: (i) => <MoneyText kobo={i.amountKobo} />,
              },
              {
                key: "status",
                header: t("bulk.col.status"),
                cell: (i) => <ItemStatusBadge status={i.status} />,
              },
              {
                key: "reason",
                header: t("bulk.col.failure"),
                cell: (i) => i.failureReason ?? <span className="text-muted-text">–</span>,
              },
            ]}
          />
        )}
      </AsyncBody>
    </SectionCard>
  );
}
