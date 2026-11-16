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
import { feeChanges, limitChanges } from "../model/describe";

const DEFAULTS = { tab: "fees" };

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
        {(config) => (
          <Tabs value={filters.tab} onValueChange={(value) => setFilter("tab", value)}>
            <TabsList>
              <TabsTrigger value="fees">{t("config.section.fees")}</TabsTrigger>
              <TabsTrigger value="limits">{t("config.section.limits")}</TabsTrigger>
              <TabsTrigger value="switches">{t("config.section.switches")}</TabsTrigger>
            </TabsList>
            <TabsContent value="fees" className="flex flex-col gap-4">
              {config.pendingFees ? (
                <PendingChangeNotice
                  section="fees"
                  proposedBy={config.pendingFees.proposedBy}
                  proposedAt={config.pendingFees.proposedAt}
                  reason={config.pendingFees.reason}
                  changes={feeChanges(config.fees, config.pendingFees.fees)}
                  canDecide={can("config:approve")}
                />
              ) : null}
              <FeesPanel
                key={config.version}
                fees={config.fees}
                editable={can("config:edit")}
                locked={config.pendingFees !== null}
              />
            </TabsContent>
            <TabsContent value="limits" className="flex flex-col gap-4">
              {config.pendingLimits ? (
                <PendingChangeNotice
                  section="limits"
                  proposedBy={config.pendingLimits.proposedBy}
                  proposedAt={config.pendingLimits.proposedAt}
                  reason={config.pendingLimits.reason}
                  changes={limitChanges(config.limits, config.pendingLimits.limits)}
                  canDecide={can("config:approve")}
                />
              ) : null}
              <LimitsPanel
                key={config.version}
                limits={config.limits}
                editable={can("config:edit")}
                locked={config.pendingLimits !== null}
              />
            </TabsContent>
            <TabsContent value="switches">
              <KillSwitchesPanel switches={config.switches} editable={can("config:kill_switch")} />
            </TabsContent>
          </Tabs>
        )}
      </AsyncBody>
    </>
  );
}
