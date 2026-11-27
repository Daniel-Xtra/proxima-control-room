import { useCan } from "@/features/auth";
import { PageHeader } from "@/shared/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { QueueHealth } from "../components/QueueHealth";
import { ScheduledJobs } from "../components/ScheduledJobs";
import { WebhookDeliveries } from "../components/WebhookDeliveries";

const DEFAULTS = { tab: "" };

const TABS = [
  { id: "deliveries", permission: "webhook_delivery:view", Panel: WebhookDeliveries },
  { id: "queues", permission: "queues:view", Panel: QueueHealth },
  { id: "scheduled", permission: "jobs:view", Panel: ScheduledJobs },
] as const;

export function JobsQueuesPage() {
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const tabs = TABS.filter((tab) => can(tab.permission));
  const active = tabs.find((tab) => tab.id === filters.tab)?.id ?? tabs[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title={t("jobs.title")}
        crumbs={[{ label: t("nav.group.system") }, { label: t("jobs.title") }]}
        description={t("jobs.description")}
      />
      <Tabs value={active} onValueChange={(tab) => setFilter("tab", tab)}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {t(`jobs.tab.${tab.id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(({ id, Panel }) => (
          <TabsContent key={id} value={id}>
            <Panel />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
