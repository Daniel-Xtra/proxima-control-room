import { PiggyBank, Swap, Vault, Wallet } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { isNoResponse } from "@/shared/api/client";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { BarList } from "@/shared/components/BarList";
import { MoneyText } from "@/shared/components/MoneyText";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TrendChart } from "@/shared/components/TrendChart";
import { RangeFilter } from "@/shared/components/RangeFilter";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCompactKobo, formatCount, formatLagos } from "@/shared/lib/format";
import { parseCustomRange } from "@/shared/lib/dateRange";
import { purposeLabel } from "@/shared/lib/purposeLabel";
import { emptyOverview, getOverview, type Overview } from "../api/overviewApi";

const DEFAULTS = { range: "30d" };

function deltaText(pct: number): string {
  return pct >= 0
    ? t("overview.delta.up", { pct })
    : t("overview.delta.down", { pct: Math.abs(pct) });
}

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
        description={`${t("overview.greeting", { name: user.name.split(" ")[0] ?? user.name })} ${period}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        }
      />

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
  // No transfers in the period means there is no rate to show, not a division by zero.
  const rate =
    tr.total.count > 0 ? Math.round((tr.successful.count / tr.total.count) * 1000) / 10 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard
          label={t("overview.kpi.transactions")}
          value={formatCount(data.kpis.transactions.total)}
          hint={deltaText(data.deltas.transactions)}
          icon={<Swap size={16} />}
          tone="info"
        />
        <StatCard
          label={t("overview.kpi.value")}
          value={formatCompactKobo(data.valueKobo)}
          hint={deltaText(data.deltas.value)}
          icon={<Wallet size={16} />}
          tone="success"
          accent
        />
        <StatCard
          label={t("overview.kpi.fixedDeposits")}
          value={formatCount(data.kpis.fixedDeposits.total)}
          hint={deltaText(data.deltas.fixedDeposits)}
          icon={<Vault size={16} />}
          tone="warning"
        />
        <StatCard
          label={t("overview.kpi.targetSavings")}
          value={formatCount(data.kpis.targetSavings.total)}
          hint={deltaText(data.deltas.targetSavings)}
          icon={<PiggyBank size={16} />}
          tone="info"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TrendCard data={data} />
        <SectionCard
          title={t("overview.recent.title")}
          actions={
            <Link
              to="/transactions"
              className="inline-block py-1.5 text-xs text-blue-strong hover:underline sm:py-0"
            >
              {t("overview.recent.open")}
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <EmptyState
              icon={Swap}
              title={t("overview.recent.empty.title")}
              description={t("overview.recent.empty.description")}
            />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {data.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-medium text-ink">{row.name}</p>
                    <p className="m-0 truncate text-xs text-muted-text">
                      {purposeLabel(row.purpose)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <MoneyText kobo={row.amountKobo} className="text-sm font-medium text-ink" />
                    <StatusBadge
                      tone={
                        row.status === "success"
                          ? "success"
                          : row.status === "pending"
                            ? "warning"
                            : "danger"
                      }
                      label={t(`transactions.status.${row.status}`)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title={t("overview.transfers.title")}
          className="md:col-span-2"
          description={t("overview.transfers.rate", { rate })}
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label={t("overview.transfers.total")} bucket={tr.total} />
            <Metric label={t("overview.transfers.successful")} bucket={tr.successful} />
            <Metric label={t("overview.transfers.failed")} bucket={tr.failed} tone="danger" />
            <Metric label={t("overview.transfers.pending")} bucket={tr.pending} tone="warning" />
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("overview.transfers.split")}</h3>
              <BarList
                items={[
                  {
                    label: t("overview.transfers.wallet"),
                    value: tr.wallet.count,
                    display: formatCount(tr.wallet.count),
                  },
                  {
                    label: t("overview.transfers.otherBank"),
                    value: tr.otherBank.count,
                    display: formatCount(tr.otherBank.count),
                  },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("overview.transfers.weekday")}</h3>
              <BarList
                items={tr.weekday.map((d) => ({
                  label: d.label,
                  value: d.count,
                  display: formatCount(d.count),
                }))}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("overview.customers.title")}>
          <p className="m-0 text-2xl font-semibold text-ink">{formatCount(customers.signUps)}</p>
          <p className="mb-4 mt-0 text-sm text-muted-text">{t("overview.customers.signUps")}</p>
          <BarList
            tone="success"
            items={[
              {
                label: t("gender.male"),
                value: customers.male,
                display: formatCount(customers.male),
              },
              {
                label: t("gender.female"),
                value: customers.female,
                display: formatCount(customers.female),
              },
              {
                label: t("gender.unspecified"),
                value: customers.unspecified,
                display: formatCount(customers.unspecified),
              },
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title={t("overview.bills.title")} flush className="md:col-span-2">
          <SimpleTable
            caption={t("overview.bills.title")}
            rows={[
              {
                name: t("overview.bills.airtime"),
                count: bills.airtime.count,
                amountKobo: bills.airtime.amountKobo,
                failures: bills.airtime.failures,
              },
              {
                name: t("overview.bills.data"),
                count: bills.data.count,
                amountKobo: bills.data.amountKobo,
                failures: bills.data.failures,
              },
              ...bills.billers,
            ]}
            getRowId={(row) => row.name}
            columns={[
              { key: "name", header: t("overview.bills.category"), cell: (r) => r.name },
              {
                key: "count",
                header: t("overview.bills.count"),
                align: "right",
                cell: (r) => formatCount(r.count),
              },
              {
                key: "amount",
                header: t("overview.bills.amount"),
                align: "right",
                cell: (r) => <MoneyText kobo={r.amountKobo} />,
              },
              {
                key: "failures",
                header: t("overview.bills.failures"),
                align: "right",
                cell: (r) => formatCount(r.failures),
              },
            ]}
          />
        </SectionCard>

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
  );
}

function TrendCard({ data }: { data: Overview }) {
  const [metric, setMetric] = useState<"value" | "volume">("value");
  const values = metric === "value" ? data.series.valueKobo : data.series.volume;
  const format = metric === "value" ? formatCompactKobo : formatCount;
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = total / values.length;
  const peak = Math.max(...values);
  const full = (n: number) =>
    metric === "value" ? <MoneyText kobo={Math.round(n)} /> : formatCount(Math.round(n));

  return (
    <SectionCard
      title={t("overview.trend.title")}
      className="md:col-span-2"
      actions={
        <div className="flex gap-1">
          {(["value", "volume"] as const).map((id) => (
            <Button
              key={id}
              size="sm"
              variant={metric === id ? "primary" : "secondary"}
              aria-pressed={metric === id}
              onClick={() => setMetric(id)}
            >
              {t(`overview.trend.${id}`)}
            </Button>
          ))}
        </div>
      }
    >
      <dl className="m-0 mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
        {(
          [
            ["total", total],
            ["average", average],
            ["peak", peak],
          ] as const
        ).map(([id, n]) => (
          <div key={id} className="flex items-baseline justify-between gap-3 sm:block">
            <dt className="text-xs text-muted-text">{t(`overview.trend.${id}`)}</dt>
            <dd className="m-0 text-base font-semibold text-ink">{full(n)}</dd>
          </div>
        ))}
      </dl>
      <TrendChart
        values={values}
        labels={data.series.labels}
        format={format}
        averageLabel={t("overview.trend.average")}
        summary={t("overview.trend.summary")}
      />
    </SectionCard>
  );
}

function Metric({
  label,
  bucket,
  tone,
}: {
  label: string;
  bucket: { count: number; amountKobo: number };
  tone?: "danger" | "warning";
}) {
  return (
    <div>
      <p className="m-0 text-xs text-muted-text">{label}</p>
      <p
        className={`m-0 text-xl font-semibold ${tone === "danger" ? "text-danger-text" : tone === "warning" ? "text-warning-text" : "text-ink"}`}
      >
        {formatCount(bucket.count)}
      </p>
      <p className="m-0 text-xs text-muted-text">
        <MoneyText kobo={bucket.amountKobo} />
      </p>
    </div>
  );
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
