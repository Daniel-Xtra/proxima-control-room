import { NavLink } from "react-router-dom";
import { useCan } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { PageHeader } from "@/shared/components/PageHeader";
import { RangeFilter } from "@/shared/components/RangeFilter";
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
import { formatCount } from "@/shared/lib/format";
import { CustomerNameCell, CustomerRowMenu } from "../components/CustomerListCells";
import { CustomerStatusBadge } from "../components/CustomerStatusBadges";
import { useCustomers } from "../api/queries";
import type { CustomerFilters, CustomerRow } from "../model/types";

const DEFAULTS = {
  q: "",
  range: "all",
  status: "all",
  kyc: "all",
  page: "1",
  limit: "10",
  sort: "",
  dir: "asc",
};

const TAB =
  "relative -mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap";

export function CustomersPage() {
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const pending = usePendingRequestCount(can("request:view_all")).data ?? 0;

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
  const dirty =
    filters.q !== "" ||
    filters.range !== "all" ||
    filters.status !== "all" ||
    filters.kyc !== "all";

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("customers.title") }]}
      />

      {can("request:view_all") ? (
        <nav
          aria-label={t("customers.title")}
          className="mb-5 flex items-end gap-6 border-b border-border"
        >
          <span aria-current="page" className={`${TAB} border-primary text-primary`}>
            {t("customers.all")}
          </span>
          <NavLink
            to="/requests"
            className={`${TAB} border-transparent text-muted-text hover:text-ink`}
          >
            {t("customers.nav.requests")}
            {pending > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-on-ink">
                {pending > 9 ? "9+" : pending}
              </span>
            ) : null}
          </NavLink>
        </nav>
      ) : null}

      <h2 className="m-0 mb-4 font-heading text-xl font-semibold text-ink">
        {t("customers.all")}
        {result.data ? (
          <span className="ml-2 font-normal text-muted-text">
            ({formatCount(result.data.total)})
          </span>
        ) : null}
      </h2>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border-soft p-4">
          <SearchBox
            value={filters.q}
            onChange={(value) => setFilter("q", value)}
            placeholder={t("customers.search")}
            label={t("customers.searchLabel")}
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
              ["yes", t("customers.filter.kycDone")],
              ["no", t("customers.filter.kycPending")],
              ["1", t("kyc.level.n", { level: 1 })],
              ["2", t("kyc.level.n", { level: 2 })],
            ]}
          />
          <RangeFilter
            label={t("customers.filter.range")}
            value={filters.range}
            onChange={(v) => setFilter("range", v)}
            options={[
              ["all", t("customers.filter.anyRange")],
              ["7d", t("range.7d")],
              ["30d", t("range.30d")],
              ["90d", t("range.90d")],
              ["365d", t("range.365d")],
            ]}
          />
          {dirty ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                (["q", "range", "status", "kyc"] as const).forEach((key) =>
                  setFilter(key, DEFAULTS[key]),
                )
              }
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
          emptyTitle={t("customers.empty.title")}
          emptyDescription={t("customers.empty.description")}
        >
          {(data) => (
            <DataTable<CustomerRow>
              numbered
              caption={t("customers.title")}
              rows={data.items}
              getRowId={(row) => row.id}
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="customers"
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
                  sortKey: "name",
                  primary: true,
                  header: t("customers.col.name"),
                  cell: (r) => <CustomerNameCell row={r} />,
                },
                { key: "phone", header: t("customers.col.phone"), cell: (r) => r.phone },
                {
                  key: "email",
                  sortKey: "email",
                  header: t("customers.col.email"),
                  cell: (r) => r.email,
                },
                {
                  key: "kyc",
                  header: t("customers.col.kyc"),
                  cell: (r) =>
                    r.kycLevel === 0
                      ? t("kyc.level.none")
                      : t("kyc.level.n", { level: r.kycLevel }),
                },
                {
                  key: "status",
                  header: t("customers.col.status"),
                  cell: (r) => <CustomerStatusBadge status={r.status} />,
                },
                {
                  key: "joined",
                  sortKey: "joined",
                  header: t("customers.col.joined"),
                  cell: (r) => <DateText iso={r.joinedAt} dateOnly />,
                },
                {
                  key: "actions",
                  header: "",
                  alwaysVisible: true,
                  className: "w-12 text-right",
                  cell: (r) => <CustomerRowMenu row={r} />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </section>
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
    <div className="w-40 max-sm:w-[calc(50%-0.25rem)]">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="h-10">
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
