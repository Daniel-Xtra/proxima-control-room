import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { SectionCard } from "@/shared/components/SectionCard";
import { TrendChart } from "@/shared/components/TrendChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useFilterOptions } from "@/shared/hooks/useFilterOptions";
import { t } from "@/shared/i18n/t";
import { formatCompactKobo, formatCount, formatKobo } from "@/shared/lib/format";
import { useOverviewTrend } from "../api/queries";
import { orZeros, zeroTrend } from "../api/zeros";
import { OfflineNote } from "./OfflineNote";
import { OVERVIEW_PERIODS, type OverviewPeriod } from "../model/periods";

/** The transactions line. It has its own period, type and metric, and its own endpoint. */
export function TrendCard() {
  const [range, setRange] = useState<OverviewPeriod>("30d");
  const [type, setType] = useState("all");
  const [metric, setMetric] = useState<"value" | "volume">("value");
  // The server lists every kind of transaction, including ones with no activity in the period, which chart as a flat line.
  const kinds = useFilterOptions("transaction_purposes");
  const chosen = kinds.find((kind) => kind.value === type);
  const live = useOverviewTrend(range, chosen?.value);
  const { query, offline } = orZeros(live, zeroTrend(range));
  const format = metric === "value" ? formatCompactKobo : formatCount;
  const formatFull = metric === "value" ? (n: number) => formatKobo(Math.round(n)) : format;

  return (
    <SectionCard title={t("overview.trend.title")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted-text">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-chart-1" />
          {chosen ? chosen.label : t("overview.trend.all")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {kinds.length > 0 ? (
            <div className="w-44">
              <Select value={chosen ? type : "all"} onValueChange={setType}>
                <SelectTrigger aria-label={t("overview.trend.type")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("overview.trend.all")}</SelectItem>
                  {kinds.map((kind) => (
                    <SelectItem key={kind.value} value={kind.value}>
                      {kind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="w-40">
            <Select value={range} onValueChange={(next) => setRange(next as OverviewPeriod)}>
              <SelectTrigger aria-label={t("overview.trend.period")}>
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
          <div className="w-28">
            <Select value={metric} onValueChange={(next) => setMetric(next as "value" | "volume")}>
              <SelectTrigger aria-label={t("overview.trend.metric")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">{t("overview.trend.value")}</SelectItem>
                <SelectItem value="volume">{t("overview.trend.volume")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {offline ? <OfflineNote onRetry={() => void live.refetch()} /> : null}
      <AsyncBody query={query} skeletonRows={6}>
        {(data) => (
          <TrendChart
            values={metric === "value" ? data.valueKobo : data.volume}
            labels={data.labels}
            format={format}
            formatFull={formatFull}
            averageLabel={t("overview.trend.average")}
            summary={t("overview.trend.summary")}
          />
        )}
      </AsyncBody>
    </SectionCard>
  );
}
