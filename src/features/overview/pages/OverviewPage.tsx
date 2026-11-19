import { useState } from "react";
import { Link } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { isNoResponse } from "@/shared/api/client";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { TrendChart } from "@/shared/components/TrendChart";
import { RangeFilter } from "@/shared/components/RangeFilter";
import { Button } from "@/shared/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useFilterOptions } from "@/shared/hooks/useFilterOptions";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCompactKobo, formatCount, formatKobo, formatLagos } from "@/shared/lib/format";
import { parseCustomRange } from "@/shared/lib/dateRange";
import { purposeLabel } from "@/shared/lib/purposeLabel";
import { emptyOverview, getOverview, type Overview } from "../api/overviewApi";
import { Delta, KpiStrip, SubStats } from "@/shared/components/KpiStrip";
import { StatusCard } from "../components/StatusCard";

const DEFAULTS = { range: "30d" };

export function OverviewPage() {
  const user = useCurrentUser();
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const query = useApiQuery(["overview", filters.range], () => getOverview(filters.range), {
    refetchInterval: 60_000,
  });
  const pending = usePendingRequestCount(can("request:view_all"));
  const custom = parseCustomRange(filters.range);
  const days = custom
    ? Math.round((Date.parse(custom.to) - Date.parse(custom.from)) / 86_400_000) + 1
    : Number(filters.range.replace("d", "")) || 30;
  const period = t("overview.period", {
    from: formatLagos(custom ? custom.from : isoDaysAgo(days), true),
    to: formatLagos(custom ? custom.to : isoDaysAgo(0), true),
  });

  return (
    <>
      <PageHeader
        title={t("overview.title")}
        crumbs={[{ label: t("overview.crumb") }, { label: t("overview.title") }]}
        description={t("overview.greeting", { name: user.name.split(" ")[0] ?? user.name })}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-text">
        <span>{t("overview.showing")}</span>
        <RangeFilter
          label={t("overview.range")}
          value={filters.range}
          onChange={(v) => setFilter("range", v)}
          options={[
            ["7d", t("range.7d")],
            ["30d", t("range.30d")],
            ["90d", t("range.90d")],
          ]}
        />
        <span className="text-xs">{period}</span>
      </div>

      {can("request:view_all") ? (
        <Link
          to="/requests"
          className="card mb-4 flex items-center justify-between px-4 py-3 text-sm text-ink hover:bg-surface-muted"
        >
          <span>{t("overview.attention.approvals")}</span>
          <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning-text">
            {pending.data ?? "–"}
          </span>
        </Link>
      ) : null}

      {query.isError && isNoResponse(query.error) ? (
        <>
          <div className="card mb-4 flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-text">
            <span>{t("overview.empty.description")}</span>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
          <OverviewBody data={emptyOverview(days)} />
        </>
      ) : (
        <AsyncBody query={query} skeletonRows={10}>
          {(data) => <OverviewBody data={data} />}
        </AsyncBody>
      )}
    </>
  );
}

function OverviewBody({ data }: { data: Overview }) {
  const { transfers: tr, bills, customers, savings } = data;
  const billCount =
    bills.airtime.count + bills.data.count + bills.billers.reduce((sum, b) => sum + b.count, 0);
  const billFailures =
    bills.airtime.failures +
    bills.data.failures +
    bills.billers.reduce((sum, b) => sum + b.failures, 0);

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip
        columns={4}
        cells={[
          {
            label: t("overview.kpi.transactions"),
            value: formatCount(data.kpis.transactions.total),
            sub: <Delta pct={data.deltas.transactions} />,
          },
          {
            label: t("overview.kpi.value"),
            value: formatCompactKobo(data.valueKobo),
            sub: <Delta pct={data.deltas.value} />,
          },
          {
            label: t("overview.kpi.fixedDeposits"),
            value: formatCount(data.kpis.fixedDeposits.total),
            sub: <Delta pct={data.deltas.fixedDeposits} />,
          },
          {
            label: t("overview.kpi.targetSavings"),
            value: formatCount(data.kpis.targetSavings.total),
            sub: <Delta pct={data.deltas.targetSavings} />,
          },
        ]}
      />

      <KpiStrip
        columns={3}
        cells={[
          {
            label: t("overview.transfers.title"),
            value: formatCount(tr.total.count),
            sub: (
              <SubStats
                items={[
                  {
                    label: t("overview.transfers.successful"),
                    value: formatCount(tr.successful.count),
                  },
                  { label: t("overview.transfers.failed"), value: formatCount(tr.failed.count) },
                  { label: t("overview.transfers.pending"), value: formatCount(tr.pending.count) },
                ]}
              />
            ),
          },
          {
            label: t("overview.bills.title"),
            value: formatCount(billCount),
            sub: (
              <SubStats
                items={[
                  { label: t("overview.bills.airtime"), value: formatCount(bills.airtime.count) },
                  { label: t("overview.bills.data"), value: formatCount(bills.data.count) },
                  { label: t("overview.bills.failures"), value: formatCount(billFailures) },
                ]}
              />
            ),
          },
          {
            label: t("overview.customers.signUps"),
            value: formatCount(customers.signUps),
            sub: (
              <SubStats
                items={[
                  { label: t("gender.male"), value: formatCount(customers.male) },
                  { label: t("gender.female"), value: formatCount(customers.female) },
                ]}
              />
            ),
          },
        ]}
      />

      <TrendCard />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatusCard data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <SectionCard title={t("overview.savings.title")}>
            <dl className="m-0 flex flex-col gap-4">
              <div>
                <dt className="text-sm text-muted-text">
                  {t("overview.savings.fixed", { count: formatCount(savings.fixedCount) })}
                </dt>
                <dd className="m-0 text-xl font-semibold text-ink">
                  <MoneyText kobo={savings.fixedTotalKobo} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-text">
                  {t("overview.savings.target", { count: formatCount(savings.targetCount) })}
                </dt>
                <dd className="m-0 text-xl font-semibold text-ink">
                  <MoneyText kobo={savings.targetTotalKobo} />
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

const TREND_RANGES = ["7d", "30d", "90d"] as const;

/** The chart has its own period, so changing it does not move the figures above it. */
function TrendCard() {
  const [range, setRange] = useState<(typeof TREND_RANGES)[number]>("30d");
  const [type, setType] = useState("all");
  const [metric, setMetric] = useState<"value" | "volume">("value");
  const query = useApiQuery(["overview", range], () => getOverview(range), {
    refetchInterval: 60_000,
  });
  // The server lists every kind of transaction, including ones with no activity in the period, which chart as a flat line.
  const served = useFilterOptions("transaction_purposes");
  const series = query.data?.series;
  const kinds = served.length
    ? served
    : (series?.byPurpose ?? []).map((entry) => ({
        value: entry.purpose,
        label: purposeLabel(entry.purpose),
      }));
  const chosen = kinds.find((kind) => kind.value === type);
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
            <Select
              value={range}
              onValueChange={(next) => setRange(next as (typeof TREND_RANGES)[number])}
            >
              <SelectTrigger aria-label={t("overview.trend.period")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TREND_RANGES.map((id) => (
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
      <AsyncBody query={query} skeletonRows={6}>
        {(data) => {
          const zeros = data.series.dates.map(() => 0);
          const source =
            (chosen && data.series.byPurpose.find((entry) => entry.purpose === chosen.value)) ||
            (chosen ? { valueKobo: zeros, volume: zeros } : data.series);
          return (
            <TrendChart
              values={metric === "value" ? source.valueKobo : source.volume}
              labels={data.series.labels}
              format={format}
              formatFull={formatFull}
              averageLabel={t("overview.trend.average")}
              summary={t("overview.trend.summary")}
            />
          );
        }}
      </AsyncBody>
    </SectionCard>
  );
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
