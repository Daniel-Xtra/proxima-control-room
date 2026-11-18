import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { FixedDepositsTable, TargetSavingsTable } from "../components/SavingsTables";

const DEFAULTS = { q: "", status: "all" };

export function SavingsPage() {
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const query = { search: filters.q, status: filters.status };

  return (
    <>
      <PageHeader
        title={t("savings.title")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("savings.title") }]}
        description={t("savings.description")}
      />
      <FilterBar
        onClear={() => (["q", "status"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))}
        dirty={filters.q !== "" || filters.status !== "all"}
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("savings.search"),
          label: t("savings.searchLabel"),
        }}
      >
        <div className="w-40">
          <Select value={filters.status} onValueChange={(value) => setFilter("status", value)}>
            <SelectTrigger aria-label={t("savings.filter.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("savings.filter.any")}</SelectItem>
              <SelectItem value="active">{t("savings.status.active")}</SelectItem>
              <SelectItem value="matured">{t("savings.status.matured")}</SelectItem>
              <SelectItem value="paid">{t("savings.status.paid")}</SelectItem>
              <SelectItem value="cancelled">{t("savings.status.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <Tabs defaultValue="fixed">
        <TabsList>
          <TabsTrigger value="fixed">{t("savings.tab.fixed")}</TabsTrigger>
          <TabsTrigger value="target">{t("savings.tab.target")}</TabsTrigger>
        </TabsList>
        <SectionCard flush className="mt-4">
          <TabsContent value="fixed" className="pt-0">
            <FixedDepositsTable key={JSON.stringify(query)} filters={query} />
          </TabsContent>
          <TabsContent value="target" className="pt-0">
            <TargetSavingsTable key={JSON.stringify(query)} filters={query} />
          </TabsContent>
        </SectionCard>
      </Tabs>
    </>
  );
}
