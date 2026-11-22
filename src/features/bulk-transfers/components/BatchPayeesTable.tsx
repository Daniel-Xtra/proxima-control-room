import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { t } from "@/shared/i18n/t";
import { isBatchActive, useBatchItems } from "../api/queries";
import type { BulkBatch, BulkItem } from "../model/types";
import { ItemStatusBadge } from "./BulkBadges";

/** The batch's payees, a page at a time. */
export function BatchPayeesTable({ batch }: { batch: BulkBatch }) {
  const [paging, setPaging] = useState({ page: 1, limit: 10 });
  const result = useBatchItems(batch.id, { ...paging, status: "all" }, isBatchActive(batch.status));

  return (
    <SectionCard title={t("bulk.section.payees")} flush>
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
