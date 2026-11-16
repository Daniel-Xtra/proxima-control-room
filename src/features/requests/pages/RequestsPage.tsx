import { useCan, useCurrentUser } from "@/features/auth";
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
import { RequestsTable } from "../components/RequestsTable";
import type { RequestKind } from "../model/types";

const DEFAULTS = { tab: "freeze", status: "pending" };
const KIND_TABS: RequestKind[] = ["freeze", "unfreeze", "limit"];

export function RequestsPage() {
  const can = useCan();
  const user = useCurrentUser();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const viewAll = can("request:view_all");
  const tab = viewAll ? filters.tab : "mine";

  return (
    <>
      <PageHeader
        title={t("requests.title")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("requests.title") }]}
        description={t("requests.description")}
      />
      <Tabs value={tab} onValueChange={(value) => setFilter("tab", value)}>
        <TabsList>
          {viewAll
            ? KIND_TABS.map((kind) => (
                <TabsTrigger key={kind} value={kind}>
                  {t(`requests.tab.${kind}`)}
                </TabsTrigger>
              ))
            : null}
          <TabsTrigger value="mine">{t("requests.tab.mine")}</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <SectionCard flush>
            <div className="flex items-center gap-2 border-b border-border-soft px-4 py-3">
              <div className="w-44">
                <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
                  <SelectTrigger aria-label={t("requests.filter.status")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("requests.status.pending")}</SelectItem>
                    <SelectItem value="approved">{t("requests.status.approved")}</SelectItem>
                    <SelectItem value="rejected">{t("requests.status.rejected")}</SelectItem>
                    <SelectItem value="all">{t("requests.filter.all")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {viewAll
              ? KIND_TABS.map((kind) => (
                  <TabsContent key={kind} value={kind} className="pt-0">
                    <RequestsTable filters={{ kind, status: filters.status }} />
                  </TabsContent>
                ))
              : null}
            <TabsContent value="mine" className="pt-0">
              <RequestsTable filters={{ status: filters.status, requestedBy: user.name }} />
            </TabsContent>
          </SectionCard>
        </div>
      </Tabs>
    </>
  );
}
