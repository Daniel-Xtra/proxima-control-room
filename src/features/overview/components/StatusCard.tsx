import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBreakdown, type StatusSlice } from "@/shared/components/StatusBreakdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { useOverviewStatus } from "../api/queries";
import { ZERO_STATUS, orZeros } from "../api/zeros";
import { OfflineNote } from "./OfflineNote";
import type { OverviewStatus } from "../api/overviewApi";
import { OVERVIEW_PERIODS, type OverviewPeriod } from "../model/periods";

function Breakdowns({ data }: { data: OverviewStatus }) {
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
  );
}

/** How transfers and bill payments ended: succeeded, failed or still pending. It has its own period and endpoint. */
export function StatusCard() {
  const [range, setRange] = useState<OverviewPeriod>("30d");
  const live = useOverviewStatus(range);
  const { query, offline } = orZeros(live, ZERO_STATUS);

  return (
    <SectionCard
      title={t("overview.status.title")}
      flush
      actions={
        <div className="w-40">
          <Select value={range} onValueChange={(next) => setRange(next as OverviewPeriod)}>
            <SelectTrigger aria-label={t("overview.status.period")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OVERVIEW_PERIODS.map((id) => (
                <SelectItem key={id} value={id}>
                  {t(`range.${id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {offline ? (
        <div className="px-4 pt-4">
          <OfflineNote onRetry={() => void live.refetch()} />
        </div>
      ) : null}
      <AsyncBody query={query} skeletonRows={4}>
        {(data) => <Breakdowns data={data} />}
      </AsyncBody>
    </SectionCard>
  );
}
