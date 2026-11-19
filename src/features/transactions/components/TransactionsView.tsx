import { DownloadSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { useCan } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { RangeFilter } from "@/shared/components/RangeFilter";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import { useTransactions } from "../api/queries";
import { TRANSACTION_PURPOSES, type Transaction } from "../model/types";
import { DirectionChip, TransactionStatusBadge } from "./TransactionBadges";
import { ExportDialog } from "./ExportDialog";
import { purposeLabel } from "@/shared/lib/purposeLabel";
import { TransactionDrawer } from "./TransactionDrawer";

export interface TransactionFilterValues {
  q: string;
  range: string;
  status: string;
  purpose: string;
  page: string;
  /** Rows per page. */
  limit: string;
  /** Sort key and direction; an empty key keeps the default order (newest first). */
  sort: string;
  dir: string;
}

interface Props {
  customerId?: string;
  filters: TransactionFilterValues;
  /** The values "Clear filters" returns to. */
  defaults: TransactionFilterValues;
  setFilter: (key: keyof TransactionFilterValues, value: string) => void;
}

/** Filter bar, table and detail drawer. Filter state is owned by the caller. */
export function TransactionsView({ customerId, filters, defaults, setFilter }: Props) {
  const can = useCan();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const result = useTransactions({
    search: filters.q,
    range: filters.range,
    status: filters.status,
    purpose: filters.purpose,
    sort: filters.sort,
    dir: filters.dir,
    customerId,
    page: Number(filters.page),
    limit: Number(filters.limit),
  });

  return (
    <>
      <FilterBar
        onClear={() =>
          (["q", "range", "status", "purpose"] as const).forEach((key) =>
            setFilter(key, defaults[key]),
          )
        }
        dirty={
          filters.q !== defaults.q ||
          filters.range !== defaults.range ||
          filters.status !== defaults.status ||
          filters.purpose !== defaults.purpose
        }
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("transactions.search"),
          label: t("transactions.searchLabel"),
        }}
      >
        <RangeFilter
          label={t("transactions.filter.range")}
          value={filters.range}
          onChange={(v) => setFilter("range", v)}
          options={[
            ["7d", t("range.7d")],
            ["30d", t("range.30d")],
            ["90d", t("range.90d")],
          ]}
        />
        <Filter
          label={t("transactions.filter.status")}
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            ["all", t("transactions.filter.anyStatus")],
            ["success", t("transactions.status.success")],
            ["pending", t("transactions.status.pending")],
            ["failed", t("transactions.status.failed")],
          ]}
        />
        <Filter
          label={t("transactions.filter.purpose")}
          value={filters.purpose}
          onChange={(v) => setFilter("purpose", v)}
          options={[
            ["all", t("transactions.filter.anyPurpose")],
            ...TRANSACTION_PURPOSES.map((p) => [p, t(`purpose.${p}`)] as [string, string]),
          ]}
        />
      </FilterBar>
      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("transactions.empty.title")}
          emptyDescription={t("transactions.empty.description")}
        >
          {(data) => (
            <DataTable<Transaction>
              caption={t("transactions.title")}
              rows={data.items}
              getRowId={(row) => row.reference}
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              onRowOpen={setSelected}
              storageKey={customerId ? "transactions-customer" : "transactions"}
              toolbarExtra={
                can("transaction:export") ? (
                  <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
                    <DownloadSimple aria-hidden="true" />
                    {t("common.exportCsv")}
                  </Button>
                ) : null
              }
              sort={
                filters.sort
                  ? { key: filters.sort, dir: filters.dir === "desc" ? "desc" : "asc" }
                  : null
              }
              onSortChange={(next) => {
                setFilter("sort", next?.key ?? "");
                setFilter("dir", next?.dir ?? "asc");
              }}
              columns={[
                {
                  key: "ref",
                  header: t("transactions.col.reference"),
                  cell: (r) => <span className="tabular">{r.reference}</span>,
                },
                ...(customerId
                  ? []
                  : [
                      {
                        key: "customer",
                        header: t("transactions.col.customer"),
                        cell: (r: Transaction) => r.customerName,
                      },
                    ]),
                {
                  key: "dir",
                  header: t("transactions.col.direction"),
                  cell: (r) => <DirectionChip direction={r.direction} />,
                },
                {
                  key: "purpose",
                  header: t("transactions.col.purpose"),
                  cell: (r) => purposeLabel(r.purpose),
                },
                {
                  key: "amount",
                  header: t("transactions.col.amount"),
                  sortKey: "amount",
                  align: "right",
                  cell: (r) => <MoneyText kobo={r.amountKobo} />,
                },
                {
                  key: "status",
                  header: t("transactions.col.status"),
                  cell: (r) => <TransactionStatusBadge status={r.status} />,
                },
                {
                  key: "date",
                  header: t("transactions.col.date"),
                  sortKey: "date",
                  cell: (r) => <DateText iso={r.createdAt} />,
                },
              ]}
            />
          )}
        </AsyncBody>
        <TransactionDrawer transaction={selected} onClose={() => setSelected(null)} />
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          filters={{
            search: filters.q,
            range: filters.range,
            status: filters.status,
            purpose: filters.purpose,
            customerId,
          }}
        />
      </SectionCard>
    </>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="w-44">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([id, text]) => (
            <SelectItem key={id} value={id}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
