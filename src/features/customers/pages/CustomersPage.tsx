import { DownloadSimple } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCan } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
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
import { maskEmail, maskTail } from "@/shared/lib/format";
import { CustomerStatusBadge, KycLevelBadge } from "../components/CustomerStatusBadges";
import { useCustomers } from "../api/queries";
import type { CustomerFilters, CustomerRow } from "../model/types";

const DEFAULTS = {
  q: "",
  range: "365d",
  status: "all",
  kyc: "all",
  page: "1",
  limit: "10",
  sort: "",
  dir: "asc",
};

export function CustomersPage() {
  const navigate = useNavigate();
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);

  const query: CustomerFilters = {
    search: filters.q,
    range: filters.range,
    status: filters.status,
    kyc: filters.kyc,
    sort: filters.sort,
    dir: filters.dir,
    page: Number(filters.page),
    limit: Number(filters.limit),
  };
  const result = useCustomers(query);

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        description={t("customers.description")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("customers.title") }]}
      />
      <FilterBar
        onClear={() =>
          (["q", "range", "status", "kyc"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))
        }
        dirty={
          filters.q !== "" ||
          filters.range !== DEFAULTS.range ||
          filters.status !== "all" ||
          filters.kyc !== "all"
        }
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("customers.search"),
          label: t("customers.searchLabel"),
        }}
      >
        <FilterSelect
          label={t("customers.filter.range")}
          value={filters.range}
          onChange={(v) => setFilter("range", v)}
          options={[
            ["7d", t("range.7d")],
            ["30d", t("range.30d")],
            ["90d", t("range.90d")],
            ["365d", t("range.365d")],
          ]}
        />
        <FilterSelect
          label={t("customers.filter.status")}
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            ["all", t("customers.filter.anyStatus")],
            ["active", t("customers.status.active")],
            ["locked", t("customers.status.locked")],
            ["frozen", t("customers.status.frozen")],
            ["deactivated", t("customers.status.deactivated")],
          ]}
        />
        <FilterSelect
          label={t("customers.filter.kyc")}
          value={filters.kyc}
          onChange={(v) => setFilter("kyc", v)}
          options={[
            ["all", t("customers.filter.anyKyc")],
            ["0", t("kyc.level.none")],
            ["1", t("kyc.level.n", { level: 1 })],
            ["2", t("kyc.level.n", { level: 2 })],
          ]}
        />
      </FilterBar>
      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("customers.empty.title")}
          emptyDescription={t("customers.empty.description")}
        >
          {(data) => (
            <DataTable<CustomerRow>
              caption={t("customers.title")}
              rows={data.items}
              getRowId={(row) => row.id}
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              onRowOpen={(row) => navigate(`/customers/${row.id}`)}
              storageKey="customers"
              toolbarExtra={
                can("customer:export") ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(t("customers.exportQueued"))}
                  >
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
                  key: "name",
                  header: t("customers.col.name"),
                  sortKey: "name",
                  cell: (r) => r.name,
                },
                {
                  key: "phone",
                  header: t("customers.col.phone"),
                  cell: (r) => maskTail(r.phone, 3),
                },
                { key: "email", header: t("customers.col.email"), cell: (r) => maskEmail(r.email) },
                {
                  key: "account",
                  header: t("customers.col.account"),
                  cell: (r) => <span className="tabular">{maskTail(r.reservedAccount, 4)}</span>,
                },
                {
                  key: "limit",
                  header: t("customers.col.tierLimit"),
                  sortKey: "limit",
                  align: "right",
                  cell: (r) => <MoneyText kobo={r.dailyLimitKobo} />,
                },
                {
                  key: "kyc",
                  header: t("customers.col.kyc"),
                  sortKey: "kyc",
                  cell: (r) => <KycLevelBadge level={r.kycLevel} />,
                },
                {
                  key: "status",
                  header: t("customers.col.status"),
                  sortKey: "status",
                  cell: (r) => <CustomerStatusBadge status={r.status} />,
                },
                {
                  key: "joined",
                  header: t("customers.col.joined"),
                  sortKey: "joined",
                  cell: (r) => <DateText iso={r.joinedAt} dateOnly />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
    </>
  );
}

function FilterSelect({
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
    <div className="w-40">
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
