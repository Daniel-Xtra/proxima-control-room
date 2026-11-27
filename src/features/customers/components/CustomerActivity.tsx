import { useState } from "react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { KpiStrip, SubStats } from "@/shared/components/KpiStrip";
import { MoneyText } from "@/shared/components/MoneyText";
import { RangeFilter } from "@/shared/components/RangeFilter";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBreakdown } from "@/shared/components/StatusBreakdown";
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
import { useCustomerTransactionSummary } from "../api/queries";
import type { Customer } from "../model/types";

const RANGES: [string, string][] = [
  ["7d", t("range.7d")],
  ["30d", t("range.30d")],
  ["90d", t("range.90d")],
];

/** The money side of a customer for a chosen period: headline figures, a trend and how transactions ended. */
export function CustomerActivity({ customer }: { customer: Customer }) {
  const [range, setRange] = useState("30d");
  const summary = useCustomerTransactionSummary(customer.id, range);
  const totals = summary.data?.totals;

  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-text">
        <span>{t("customers.stats.showing")}</span>
        <RangeFilter
          label={t("overview.range")}
          value={range}
          onChange={setRange}
          options={RANGES}
          // The same server limit as the dashboard: a custom period is at most 366 days.
          maxSpanDays={366}
        />
      </div>

      <KpiStrip
        columns={4}
        cells={[
          {
            label: t("customers.stats.value"),
            value: totals ? <MoneyText kobo={totals.valueKobo} /> : "–",
            sub: (
              <SubStats
                items={[
                  {
                    label: t("customers.stats.volume"),
                    value: totals ? formatCount(totals.volume) : "–",
                  },
                ]}
              />
            ),
          },
          {
            label: t("customers.summary.balance"),
            value: <MoneyText kobo={customer.balanceKobo} />,
            sub: (
              <SubStats
                items={[
                  {
                    label: t("customers.summary.ledger"),
                    value: formatCompactKobo(customer.ledgerBalanceKobo),
                  },
                ]}
              />
            ),
          },
          {
            label: t("customers.summary.moneyIn"),
            value: <MoneyText kobo={customer.moneyInKobo} />,
            sub: <p className="m-0 text-xs text-muted-text">{t("customers.stats.allTime")}</p>,
          },
          {
            label: t("customers.summary.moneyOut"),
            value: <MoneyText kobo={customer.moneyOutKobo} />,
            sub: <p className="m-0 text-xs text-muted-text">{t("customers.stats.allTime")}</p>,
          },
        ]}
      />

      <div className="@container">
        <div className="grid items-start gap-4 @min-[880px]:grid-cols-3">
          <div className="min-w-0 @min-[880px]:col-span-2">
            <TrendCard customerId={customer.id} range={range} />
          </div>
          <SectionCard title={t("customers.stats.status")}>
            <AsyncBody query={summary} skeletonRows={4}>
              {(data) => (
                <StatusBreakdown
                  stacked
                  caption={t("customers.stats.status")}
                  totalKobo={
                    data.statuses.success.valueKobo +
                    data.statuses.failed.valueKobo +
                    data.statuses.pending.valueKobo
                  }
                  slices={[
                    {
                      label: t("overview.transfers.successful"),
                      tone: "success",
                      count: data.statuses.success.count,
                      amountKobo: data.statuses.success.valueKobo,
                    },
                    {
                      label: t("overview.transfers.failed"),
                      tone: "danger",
                      count: data.statuses.failed.count,
                      amountKobo: data.statuses.failed.valueKobo,
                    },
                    {
                      label: t("overview.transfers.pending"),
                      tone: "warning",
                      count: data.statuses.pending.count,
                      amountKobo: data.statuses.pending.valueKobo,
                    },
                  ]}
                />
              )}
            </AsyncBody>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function TrendCard({ customerId, range }: { customerId: string; range: string }) {
  const [type, setType] = useState("all");
  const [metric, setMetric] = useState<"value" | "volume">("value");
  const kinds = useFilterOptions("transaction_purposes");
  const chosen = kinds.find((kind) => kind.value === type);
  const query = useCustomerTransactionSummary(customerId, range, chosen?.value);
  const format = metric === "value" ? formatCompactKobo : formatCount;
  const formatFull = metric === "value" ? (n: number) => formatKobo(Math.round(n)) : format;

  return (
    <SectionCard title={t("customers.stats.trends")}>
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
      <AsyncBody query={query} skeletonRows={5}>
        {(data) => (
          <TrendChart
            values={metric === "value" ? data.series.valueKobo : data.series.volume}
            labels={data.series.labels}
            format={format}
            formatFull={formatFull}
            averageLabel={t("overview.trend.average")}
            summary={t("customers.stats.summary")}
          />
        )}
      </AsyncBody>
    </SectionCard>
  );
}
