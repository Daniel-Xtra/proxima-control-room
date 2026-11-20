import { AsyncBody } from "@/shared/components/AsyncBody";
import { Delta, KpiStrip, SubStats } from "@/shared/components/KpiStrip";
import { t } from "@/shared/i18n/t";
import { formatCompactKobo, formatCount } from "@/shared/lib/format";
import { useOverviewSummary } from "../api/queries";
import { ZERO_SUMMARY, orZeros } from "../api/zeros";
import { OfflineNote } from "./OfflineNote";

/** The two strips of headline figures. They are the only part of the page that follows the "Showing" period. */
export function SummaryCards({ range }: { range: string }) {
  const live = useOverviewSummary(range);
  const { query, offline } = orZeros(live, ZERO_SUMMARY);

  return (
    <>
      {offline ? <OfflineNote onRetry={() => void live.refetch()} /> : null}
      <AsyncBody query={query} skeletonRows={4}>
        {(data) => (
          <>
            <KpiStrip
              columns={4}
              cells={[
                {
                  label: t("overview.kpi.transactions"),
                  value: formatCount(data.transactions.total),
                  sub: <Delta pct={data.deltas.transactions} />,
                },
                {
                  label: t("overview.kpi.value"),
                  value: formatCompactKobo(data.transactions.valueKobo),
                  sub: <Delta pct={data.deltas.value} />,
                },
                {
                  label: t("overview.kpi.fixedDeposits"),
                  value: formatCount(data.fixedDeposits.total),
                  sub: <Delta pct={data.deltas.fixedDeposits} />,
                },
                {
                  label: t("overview.kpi.targetSavings"),
                  value: formatCount(data.targetSavings.total),
                  sub: <Delta pct={data.deltas.targetSavings} />,
                },
              ]}
            />

            <KpiStrip
              columns={3}
              cells={[
                {
                  label: t("overview.transfers.title"),
                  value: formatCount(data.transfers.total),
                  sub: (
                    <SubStats
                      items={[
                        {
                          label: t("overview.transfers.successful"),
                          value: formatCount(data.transfers.successful),
                        },
                        {
                          label: t("overview.transfers.failed"),
                          value: formatCount(data.transfers.failed),
                        },
                        {
                          label: t("overview.transfers.pending"),
                          value: formatCount(data.transfers.pending),
                        },
                      ]}
                    />
                  ),
                },
                {
                  label: t("overview.bills.title"),
                  value: formatCount(data.bills.total),
                  sub: (
                    <SubStats
                      items={[
                        {
                          label: t("overview.bills.airtime"),
                          value: formatCount(data.bills.airtime),
                        },
                        { label: t("overview.bills.data"), value: formatCount(data.bills.data) },
                        {
                          label: t("overview.bills.failures"),
                          value: formatCount(data.bills.failures),
                        },
                      ]}
                    />
                  ),
                },
                {
                  label: t("overview.customers.signUps"),
                  value: formatCount(data.signUps.total),
                  sub: (
                    <SubStats
                      items={[
                        { label: t("gender.male"), value: formatCount(data.signUps.male) },
                        { label: t("gender.female"), value: formatCount(data.signUps.female) },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </AsyncBody>
    </>
  );
}
