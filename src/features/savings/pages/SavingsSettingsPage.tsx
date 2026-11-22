import { useCan } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { useSavingsSettings } from "../api/settingsQueries";
import { PendingSettingsNotice } from "../components/PendingSettingsNotice";
import { ProductsPanel } from "../components/ProductsPanel";
import { TargetLimitsPanel } from "../components/TargetLimitsPanel";
import { TermsPanel } from "../components/TermsPanel";
import type { PendingSettingsChange, SavingsSettings } from "../model/settingsTypes";

const DEFAULTS = { tab: "terms" };

const LIMIT_FIELDS = [
  "min_target_amount",
  "min_top_up_amount",
  "min_withdrawal_amount",
  "min_recurring_amount",
];
const touchesLimits = (change: PendingSettingsChange) =>
  change.fields.some((field) => LIMIT_FIELDS.includes(field));
const touchesRates = (change: PendingSettingsChange) =>
  change.fields.some((field) => !LIMIT_FIELDS.includes(field));

/** What a waiting change is about: the term in days, or the product's name. */
function subjectOf(change: PendingSettingsChange, settings: SavingsSettings) {
  if (change.type === "SAVINGS_PRODUCT_CHANGE") {
    return settings.products.find((p) => p.code === change.targetId)?.name ?? change.targetId;
  }
  const term = settings.terms.find((row) => String(row.id) === change.targetId);
  if (term) return t("savings.days", { count: term.days });
  const days = Number(change.targetId.replace("term:", ""));
  return Number.isFinite(days) && days > 0 ? t("savings.days", { count: days }) : change.targetId;
}

export function SavingsSettingsPage() {
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useSavingsSettings();

  return (
    <>
      <PageHeader
        title={t("savingsSettings.title")}
        description={t("savingsSettings.description")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("savingsSettings.title") }]}
      />
      <AsyncBody query={result}>
        {(settings) => {
          const pending = (match: (change: PendingSettingsChange) => boolean) =>
            settings.pending
              .filter(match)
              .map((change) => (
                <PendingSettingsNotice
                  key={change.id}
                  change={change}
                  subject={subjectOf(change, settings)}
                  canDecide={can("savings:config_approve")}
                />
              ));
          return (
            <Tabs value={filters.tab} onValueChange={(value) => setFilter("tab", value)}>
              <TabsList>
                <TabsTrigger value="terms">{t("savingsSettings.tab.terms")}</TabsTrigger>
                <TabsTrigger value="products">{t("savingsSettings.tab.products")}</TabsTrigger>
                <TabsTrigger value="limits">{t("savingsSettings.tab.limits")}</TabsTrigger>
              </TabsList>
              <TabsContent value="terms" className="flex flex-col gap-4">
                {pending((change) => change.type !== "SAVINGS_PRODUCT_CHANGE")}
                <TermsPanel terms={settings.terms} editable={can("savings:config_edit")} />
              </TabsContent>
              <TabsContent value="products" className="flex flex-col gap-4">
                {pending(
                  (change) => change.type === "SAVINGS_PRODUCT_CHANGE" && touchesRates(change),
                )}
                <ProductsPanel products={settings.products} editable={can("savings:config_edit")} />
              </TabsContent>
              <TabsContent value="limits" className="flex flex-col gap-4">
                {pending(
                  (change) => change.type === "SAVINGS_PRODUCT_CHANGE" && touchesLimits(change),
                )}
                <TargetLimitsPanel
                  product={settings.products.find((p) => p.type === "target_savings")}
                  editable={can("savings:config_edit")}
                />
              </TabsContent>
            </Tabs>
          );
        }}
      </AsyncBody>
    </>
  );
}
