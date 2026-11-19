import { StatusBreakdown, type StatusSlice } from "@/shared/components/StatusBreakdown";
import { SectionCard } from "@/shared/components/SectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import type { Overview } from "../api/overviewApi";

/** How transfers and bill payments ended: succeeded, failed or still pending. */
export function StatusCard({ data }: { data: Overview }) {
  const { transfers, bills } = data;
  const billSlices: StatusSlice[] = [
    {
      label: t("overview.transfers.successful"),
      tone: "success",
      count: bills.airtime.successes + bills.data.successes,
    },
    {
      label: t("overview.transfers.failed"),
      tone: "danger",
      count:
        bills.airtime.failures +
        bills.data.failures +
        bills.billers.reduce((sum, biller) => sum + biller.failures, 0),
    },
    {
      label: t("overview.transfers.pending"),
      tone: "warning",
      count: bills.airtime.pending + bills.data.pending,
    },
  ];
  const billTotal =
    bills.airtime.amountKobo +
    bills.data.amountKobo +
    bills.billers.reduce((sum, biller) => sum + biller.amountKobo, 0);

  return (
    <SectionCard title={t("overview.status.title")} flush>
      <Tabs defaultValue="transfers" className="mt-0 gap-0">
        <TabsList className="px-4">
          <TabsTrigger value="transfers" className="pt-3">
            {t("overview.transfers.title")}
          </TabsTrigger>
          <TabsTrigger value="bills" className="pt-3">
            {t("overview.bills.title")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transfers" className="p-4">
          <StatusBreakdown
            caption={t("overview.status.title")}
            totalKobo={transfers.total.amountKobo}
            slices={[
              {
                label: t("overview.transfers.successful"),
                tone: "success",
                count: transfers.successful.count,
                amountKobo: transfers.successful.amountKobo,
              },
              {
                label: t("overview.transfers.failed"),
                tone: "danger",
                count: transfers.failed.count,
                amountKobo: transfers.failed.amountKobo,
              },
              {
                label: t("overview.transfers.pending"),
                tone: "warning",
                count: transfers.pending.count,
                amountKobo: transfers.pending.amountKobo,
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="bills" className="p-4">
          <StatusBreakdown
            caption={t("overview.status.title")}
            slices={billSlices}
            totalKobo={billTotal}
          />
        </TabsContent>
      </Tabs>
    </SectionCard>
  );
}
