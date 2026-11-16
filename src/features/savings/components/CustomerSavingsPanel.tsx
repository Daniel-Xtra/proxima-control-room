import { SectionCard } from "@/shared/components/SectionCard";
import { t } from "@/shared/i18n/t";
import { FixedDepositsTable, TargetSavingsTable } from "./SavingsTables";

export function CustomerSavingsPanel({ customerId }: { customerId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("savings.tab.fixed")} flush>
        <FixedDepositsTable customerId={customerId} />
      </SectionCard>
      <SectionCard title={t("savings.tab.target")} flush>
        <TargetSavingsTable customerId={customerId} />
      </SectionCard>
    </div>
  );
}
