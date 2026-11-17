import { useCan } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { usePlatformConfig } from "../api/queries";
import { FeesPanel } from "../components/FeesPanel";
import { KillSwitchesPanel } from "../components/KillSwitchesPanel";
import { LimitsPanel } from "../components/LimitsPanel";
import { PendingChangeNotice } from "../components/PendingChangeNotice";
import type { PendingChange, PlatformConfig } from "../model/types";

const DEFAULTS = { tab: "fees" };

/** What a waiting change is about: the fee rule's name, or the tier. */
function subjectOf(change: PendingChange, config: PlatformConfig) {
  if (change.kind === "fee") {
    return config.fees.find((fee) => String(fee.id) === change.targetId)?.name ?? change.targetId;
  }
  const tier = config.limits.find((limit) => limit.id === change.targetId);
  return tier?.kycLevel ? t("config.tier.level", { level: tier.kycLevel }) : change.targetId;
}

export function PlatformConfigPage() {
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = usePlatformConfig();

  return (
    <>
      <PageHeader
        title={t("config.title")}
        description={t("config.description")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("config.title") }]}
      />
      <AsyncBody query={result}>
        {(config) => {
          const pending = (kind: PendingChange["kind"]) =>
            config.pending
              .filter((change) => change.kind === kind)
              .map((change) => (
                <PendingChangeNotice
                  key={change.id}
                  change={change}
                  subject={subjectOf(change, config)}
                  canDecide={can("config:approve")}
                />
              ));
          return (
            <Tabs value={filters.tab} onValueChange={(value) => setFilter("tab", value)}>
              <TabsList>
                <TabsTrigger value="fees">{t("config.section.fees")}</TabsTrigger>
                <TabsTrigger value="limits">{t("config.section.limits")}</TabsTrigger>
                <TabsTrigger value="switches">{t("config.section.switches")}</TabsTrigger>
              </TabsList>
              <TabsContent value="fees" className="flex flex-col gap-4">
                {pending("fee")}
                <FeesPanel fees={config.fees} editable={can("config:edit")} />
              </TabsContent>
              <TabsContent value="limits" className="flex flex-col gap-4">
                {pending("limit")}
                <LimitsPanel
                  limits={config.limits}
                  unit={config.limitUnit}
                  editable={can("config:edit")}
                />
              </TabsContent>
              <TabsContent value="switches">
                <KillSwitchesPanel
                  switches={config.switches}
                  editable={can("config:kill_switch")}
                />
              </TabsContent>
            </Tabs>
          );
        }}
      </AsyncBody>
    </>
  );
}
