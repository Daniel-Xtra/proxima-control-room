import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import type { AuditEntry } from "@/shared/api/auditStore";
import { listAuditLog } from "../api/riskApi";

const DEFAULTS = { q: "", status: "all" };

export function AuditLogPage() {
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const query = useApiQuery(
    ["risk", "audit", filters],
    () => listAuditLog({ search: filters.q, status: filters.status }),
    {
      staleTime: 0,
    },
  );

  return (
    <>
      <PageHeader
        title={t("audit.title")}
        description={t("audit.description")}
        crumbs={[{ label: t("nav.group.risk") }, { label: t("audit.title") }]}
      />
      <FilterBar
        onClear={() => (["q", "status"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))}
        dirty={filters.q !== "" || filters.status !== "all"}
        search={{
          value: filters.q,
          onChange: (v) => setFilter("q", v),
          placeholder: t("audit.search"),
          label: t("audit.searchLabel"),
        }}
      >
        <div className="w-40">
          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger aria-label={t("audit.filter.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.filter.any")}</SelectItem>
              <SelectItem value="success">{t("audit.status.success")}</SelectItem>
              <SelectItem value="failed">{t("audit.status.failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <SectionCard flush>
        <AsyncBody
          query={query}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("audit.empty")}
        >
          {(rows) => (
            <SimpleTable<AuditEntry>
              caption={t("audit.title")}
              rows={rows}
              getRowId={(r) => r.id}
              columns={[
                { key: "at", header: t("audit.col.time"), cell: (r) => <DateText iso={r.at} /> },
                { key: "actor", header: t("audit.col.actor"), cell: (r) => r.actor },
                {
                  key: "action",
                  header: t("audit.col.action"),
                  sortValue: (r: { action: string }) => r.action,
                  cell: (r) => <code className="text-xs">{r.action}</code>,
                },
                { key: "target", header: t("audit.col.target"), cell: (r) => r.target },
                {
                  key: "change",
                  header: t("audit.col.change"),
                  cell: (r) =>
                    r.before || r.after
                      ? `${r.before ?? "–"} → ${r.after ?? "–"}`
                      : (r.reason ?? t("common.notAvailable")),
                },
                {
                  key: "ip",
                  header: t("audit.ip"),
                  sortValue: (r: { ip: string }) => r.ip,
                  cell: (r) => <span className="tabular">{r.ip}</span>,
                },
                {
                  key: "status",
                  header: t("audit.col.status"),
                  sortValue: (r: { status: string }) => r.status,
                  cell: (r) => (
                    <StatusBadge
                      tone={r.status === "success" ? "success" : "danger"}
                      label={t(`audit.status.${r.status}`)}
                    />
                  ),
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
    </>
  );
}
