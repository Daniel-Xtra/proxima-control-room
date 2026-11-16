import { Plus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Can } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { useBatches } from "../api/queries";
import { BatchStatusBadge } from "../components/BulkBadges";
import type { BatchRow } from "../model/types";

const DEFAULTS = { q: "", status: "all" };

export function BulkPaymentsPage() {
  const navigate = useNavigate();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useBatches({ search: filters.q, status: filters.status });

  return (
    <>
      <PageHeader
        title={t("bulk.title")}
        description={t("bulk.description")}
        crumbs={[{ label: t("nav.group.payments") }, { label: t("bulk.title") }]}
        actions={
          <Can permission="bulk_payment:initiate">
            <Button onClick={() => navigate("/bulk-payments/new")}>
              <Plus aria-hidden="true" />
              {t("bulk.new")}
            </Button>
          </Can>
        }
      />
      <FilterBar
        onClear={() => (["q", "status"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))}
        dirty={filters.q !== "" || filters.status !== "all"}
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("bulk.search"),
          label: t("bulk.searchLabel"),
        }}
      >
        <div className="w-52">
          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger aria-label={t("bulk.filter.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bulk.filter.any")}</SelectItem>
              <SelectItem value="pending_approval">{t("bulk.status.pending_approval")}</SelectItem>
              <SelectItem value="scheduled">{t("bulk.status.scheduled")}</SelectItem>
              <SelectItem value="completed">{t("bulk.status.completed")}</SelectItem>
              <SelectItem value="partially_failed">{t("bulk.status.partially_failed")}</SelectItem>
              <SelectItem value="rejected">{t("bulk.status.rejected")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("bulk.empty.title")}
          emptyDescription={t("bulk.empty.description")}
        >
          {(rows) => (
            <SimpleTable<BatchRow>
              caption={t("bulk.title")}
              rows={rows}
              getRowId={(r) => r.id}
              onRowOpen={(row) => navigate(`/bulk-payments/${row.id}`)}
              columns={[
                {
                  key: "name",
                  header: t("bulk.col.name"),
                  sortValue: (r) => r.name,
                  cell: (r) => r.name,
                },
                {
                  key: "payees",
                  header: t("bulk.col.payees"),
                  align: "right",
                  sortValue: (r) => r.itemCount,
                  cell: (r) => formatCount(r.itemCount),
                },
                {
                  key: "total",
                  header: t("bulk.col.total"),
                  align: "right",
                  sortValue: (r) => r.totalKobo,
                  cell: (r) => <MoneyText kobo={r.totalKobo} />,
                },
                {
                  key: "status",
                  header: t("bulk.col.status"),
                  sortValue: (r) => r.status,
                  cell: (r) => <BatchStatusBadge status={r.status} />,
                },
                {
                  key: "pays",
                  header: t("bulk.col.pays"),
                  sortValue: (r) => r.scheduledFor ?? "",
                  cell: (r) =>
                    r.scheduledFor ? (
                      <DateText iso={r.scheduledFor} />
                    ) : (
                      t("bulk.timing.onApproval")
                    ),
                },
                {
                  key: "by",
                  header: t("bulk.col.createdBy"),
                  sortValue: (r) => r.createdBy,
                  cell: (r) => r.createdBy,
                },
                {
                  key: "at",
                  header: t("bulk.col.created"),
                  sortValue: (r) => r.createdAt,
                  cell: (r) => <DateText iso={r.createdAt} />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
    </>
  );
}
