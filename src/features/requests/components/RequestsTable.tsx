import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { MoneyText } from "@/shared/components/MoneyText";
import { DataTable } from "@/shared/components/DataTable";
import { t } from "@/shared/i18n/t";
import { useRequests } from "../api/queries";
import type { AccountRequest, RequestFilters } from "../model/types";
import { requestLabel } from "./requestLabel";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { ReviewDrawer } from "./ReviewDrawer";

export function RequestsTable({
  filters,
  showCustomer = true,
}: {
  filters: RequestFilters;
  showCustomer?: boolean;
}) {
  const result = useRequests(filters);
  const [selected, setSelected] = useState<AccountRequest | null>(null);
  const [paging, setPaging] = useState({ page: 1, limit: 10 });

  /** The page shown, pulled back when a filter leaves fewer pages than the one open. */
  const page = (total: number) =>
    Math.min(paging.page, Math.max(1, Math.ceil(total / paging.limit)));

  return (
    <>
      <AsyncBody
        query={result}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={t("requests.empty.title")}
        emptyDescription={t("requests.empty.description")}
      >
        {(all) => (
          <DataTable<AccountRequest>
            storageKey="requests"
            caption={t("requests.title")}
            rows={all.slice((page(all.length) - 1) * paging.limit, page(all.length) * paging.limit)}
            page={page(all.length)}
            limit={paging.limit}
            total={all.length}
            onPageChange={(next) => setPaging((current) => ({ ...current, page: next }))}
            onLimitChange={(limit) => setPaging({ page: 1, limit })}
            getRowId={(r) => r.id}
            onRowOpen={setSelected}
            columns={[
              ...(showCustomer
                ? [
                    {
                      key: "customer",
                      header: t("requests.col.customer"),
                      sortValue: (r: { customerName: string }) => r.customerName,
                      cell: (r: AccountRequest) => r.customerName,
                    },
                  ]
                : [
                    {
                      key: "kind",
                      header: t("requests.col.type"),
                      sortValue: (r: { kind: string }) => r.kind,
                      cell: (r: AccountRequest) => requestLabel(r),
                    },
                  ]),
              ...(showCustomer && !filters.kind
                ? [
                    {
                      key: "kind",
                      header: t("requests.col.type"),
                      sortValue: (r: { kind: string }) => r.kind,
                      cell: (r: AccountRequest) => requestLabel(r),
                    },
                  ]
                : []),
              { key: "by", header: t("requests.col.requestedBy"), cell: (r) => r.requestedBy },
              {
                key: "reason",
                header: t("requests.col.reason"),
                cell: (r) =>
                  r.limits ? (
                    <span className="inline-flex items-center gap-1.5">
                      {r.limits.currentDailyKobo === null ? null : (
                        <>
                          <MoneyText kobo={r.limits.currentDailyKobo} />
                          <ArrowRight aria-hidden="true" className="size-3 text-muted-text" />
                        </>
                      )}
                      <MoneyText kobo={r.limits.requestedDailyKobo} className="font-semibold" />
                    </span>
                  ) : (
                    r.reason
                  ),
              },
              {
                key: "status",
                header: t("requests.col.status"),
                sortValue: (r: { status: string }) => r.status,
                cell: (r) => <RequestStatusBadge status={r.status} />,
              },
              {
                key: "date",
                header: t("requests.col.date"),
                sortValue: (r: { createdAt: string }) => r.createdAt,
                cell: (r) => <DateText iso={r.createdAt} />,
              },
            ]}
          />
        )}
      </AsyncBody>
      <ReviewDrawer request={selected} onClose={() => setSelected(null)} />
    </>
  );
}
