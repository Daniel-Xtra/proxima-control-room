import { ArrowRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchBox } from "@/shared/components/SearchBox";
import { Button } from "@/shared/components/ui/Button";
import { NativeSelect } from "@/shared/components/ui/NativeSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { useUpgradeRequests } from "../api/queries";
import { CustomerAreaTabs } from "../components/CustomerAreaTabs";
import { UpgradeNameCell } from "../components/UpgradeListCells";
import { UpgradeStatusBadge } from "../components/CustomerStatusBadges";
import type { UpgradeRequest } from "../model/types";

const DEFAULTS = { q: "", status: "all", page: "1", limit: "10" };

export function UpgradeRequestsPage() {
  const navigate = useNavigate();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useUpgradeRequests({
    search: filters.q,
    status: filters.status,
    page: Number(filters.page),
    limit: Number(filters.limit),
  });
  const dirty = filters.q !== "" || filters.status !== "all";

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        crumbs={[
          { label: t("nav.group.customers") },
          { label: t("customers.title"), to: "/customers" },
          { label: t("customers.nav.requests") },
        ]}
      />
      <CustomerAreaTabs current="upgrades" />

      <h2 className="m-0 mb-1 font-heading text-xl font-semibold text-ink">
        {t("customers.nav.requests")}
      </h2>
      <p className="m-0 mb-4 text-sm text-muted-text">{t("customers.upgrade.description")}</p>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border-soft p-4">
          <SearchBox
            value={filters.q}
            onChange={(value) => setFilter("q", value)}
            placeholder={t("customers.search")}
            label={t("customers.upgrade.searchLabel")}
          />
          <div className="w-44 max-sm:w-[calc(50%-0.25rem)]">
            <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
              <SelectTrigger aria-label={t("customers.filter.status")} className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("customers.filter.anyStatus")}</SelectItem>
                <SelectItem value="pending">{t("customers.upgrade.status.pending")}</SelectItem>
                <SelectItem value="resubmitted">
                  {t("customers.upgrade.status.resubmitted")}
                </SelectItem>
                <SelectItem value="approved">{t("customers.upgrade.status.approved")}</SelectItem>
                <SelectItem value="rejected">{t("customers.upgrade.status.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dirty ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (["q", "status"] as const).forEach((k) => setFilter(k, DEFAULTS[k]))}
            >
              {t("common.clearFilters")}
            </Button>
          ) : null}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-text">
            {t("table.perPage")}
            <NativeSelect
              value={filters.limit}
              onChange={(event) => setFilter("limit", event.target.value)}
              className="w-20"
            >
              {["5", "10", "25", "50"].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        <AsyncBody
          query={result}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("customers.upgrade.empty.title")}
          emptyDescription={t("customers.upgrade.empty.description")}
        >
          {(data) => (
            <DataTable<UpgradeRequest>
              toolbar={false}
              caption={t("customers.nav.requests")}
              rows={data.items}
              getRowId={(row) => row.id}
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="upgrade-requests"
              onRowOpen={(row) => navigate(`/customers/${row.id}?tab=kyc`)}
              columns={[
                {
                  key: "name",
                  primary: true,
                  header: t("customers.col.name"),
                  cell: (r) => <UpgradeNameCell row={r} />,
                },
                { key: "phone", header: t("customers.col.phone"), cell: (r) => r.phone },
                { key: "email", header: t("customers.col.email"), cell: (r) => r.email },
                {
                  key: "tier",
                  header: t("customers.upgrade.col.tier"),
                  cell: (r) =>
                    r.currentTier >= r.targetTier ? (
                      t("kyc.level.n", { level: r.currentTier })
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {t("kyc.level.n", { level: r.currentTier })}
                        <ArrowRight aria-hidden="true" className="size-3 text-muted-text" />
                        {t("kyc.level.n", { level: r.targetTier })}
                      </span>
                    ),
                },
                {
                  key: "status",
                  header: t("customers.col.status"),
                  cell: (r) => <UpgradeStatusBadge status={r.status} />,
                },
                {
                  key: "submitted",
                  header: t("customers.upgrade.col.submitted"),
                  cell: (r) => <DateText iso={r.submittedAt} dateOnly />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </section>
    </>
  );
}
