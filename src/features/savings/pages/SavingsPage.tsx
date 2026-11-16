import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { FixedDepositsTable, TargetSavingsTable } from "../components/SavingsTables";

export function SavingsPage() {
  return (
    <>
      <PageHeader
        title={t("savings.title")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("savings.title") }]}
        description={t("savings.description")}
      />
      <p className="mb-3 rounded-md bg-info-bg px-3 py-2 text-sm text-info">{t("savings.gap")}</p>
      <Tabs defaultValue="fixed">
        <TabsList>
          <TabsTrigger value="fixed">{t("savings.tab.fixed")}</TabsTrigger>
          <TabsTrigger value="target">{t("savings.tab.target")}</TabsTrigger>
        </TabsList>
        <SectionCard flush className="mt-4">
          <TabsContent value="fixed" className="pt-0">
            <FixedDepositsTable />
          </TabsContent>
          <TabsContent value="target" className="pt-0">
            <TargetSavingsTable />
          </TabsContent>
        </SectionCard>
      </Tabs>
    </>
  );
}
