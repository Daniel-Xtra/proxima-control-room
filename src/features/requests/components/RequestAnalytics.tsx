import { AsyncBody } from "@/shared/components/AsyncBody";
import { BarList } from "@/shared/components/BarList";
import { KpiStrip } from "@/shared/components/KpiStrip";
import { SectionCard } from "@/shared/components/SectionCard";
import { customRange, customWindow, isCustomRange, lagosDay } from "@/shared/lib/dateRange";
import { formatCount, NO_VALUE } from "@/shared/lib/format";
import { t } from "@/shared/i18n/t";
import { useRequests } from "../api/queries";
import { OUTCOMES, splitDuration, summariseRequests, type RequestSummary } from "../model/summary";
import type { RequestScope } from "../model/types";
import { requestLabel } from "./requestLabel";

/** The most requests the list call loads. Past this, the figures cover only the newest ones. */
const LOAD_CAP = 1000;

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function periodWindow(period: string) {
  const days = PERIOD_DAYS[period] ?? 30;
  const range = isCustomRange(period) ? period : customRange(lagosDay(1 - days), lagosDay());
  const window = customWindow(range) ?? customWindow(customRange(lagosDay(1 - days), lagosDay()))!;
  return { from: Date.parse(window.from), to: Date.parse(window.to) };
}

function durationText(ms: number) {
  const { days, hours, minutes } = splitDuration(ms);
  if (days) return t("requests.analytics.daysHours", { days, hours });
  if (hours) return t("requests.analytics.hoursMinutes", { hours, minutes });
  return t("requests.analytics.minutes", { minutes });
}

const note = (text: string) => <p className="m-0 text-xs text-muted-text">{text}</p>;

/** `asOf` is when the pending list was loaded; ages are measured from then. */
function Figures({ summary, asOf }: { summary: RequestSummary; asOf: number }) {
  const { outcomes } = summary;
  const closed = OUTCOMES.filter((outcome) => outcomes[outcome] > 0);

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip
        columns={4}
        cells={[
          {
            label: t("requests.analytics.waiting"),
            value: formatCount(summary.waiting),
            sub: note(
              summary.oldestWaitingAt
                ? t("requests.analytics.oldest", {
                    age: durationText(asOf - Date.parse(summary.oldestWaitingAt)),
                  })
                : t("requests.analytics.noneWaiting"),
            ),
          },
          {
            label: t("requests.status.approved"),
            value: formatCount(outcomes.approved),
            sub: note(t("requests.analytics.inPeriod")),
          },
          {
            label: t("requests.status.rejected"),
            value: formatCount(outcomes.rejected),
            sub: note(t("requests.analytics.inPeriod")),
          },
          {
            label: t("requests.analytics.averageTime"),
            value:
              summary.averageDecisionMs === null
                ? NO_VALUE
                : durationText(summary.averageDecisionMs),
            sub: note(t("requests.analytics.averageHint")),
          },
        ]}
      />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <SectionCard title={t("requests.analytics.byType")}>
          {summary.waitingByType.length ? (
            <BarList
              wideLabels
              items={summary.waitingByType.map(({ sample, count }) => ({
                label: requestLabel(sample),
                value: count,
              }))}
            />
          ) : (
            note(t("requests.analytics.noneWaiting"))
          )}
        </SectionCard>
        <SectionCard title={t("requests.analytics.outcomes")}>
          {closed.length ? (
            <BarList
              wideLabels
              items={closed.map((outcome) => ({
                label: t(`requests.status.${outcome}`),
                value: outcomes[outcome],
              }))}
            />
          ) : (
            note(t("requests.analytics.noneClosed"))
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/**
 * Headline figures above the request tables. "Waiting" is what this admin can decide now; the rest cover requests closed in
 * the chosen period, among those this admin may see.
 */
export function RequestAnalytics({
  period,
  scope,
}: {
  period: string;
  scope: Extract<RequestScope, "all" | "handled">;
}) {
  const pending = useRequests({ status: "pending", scope: "assigned" });
  const all = useRequests({ status: "all", scope });
  const failed = pending.isError ? pending : all;
  const query = {
    data:
      pending.data && all.data
        ? summariseRequests(pending.data, all.data, periodWindow(period))
        : undefined,
    isLoading: pending.isLoading || all.isLoading,
    isError: pending.isError || all.isError,
    error: failed.error,
    refetch: failed.refetch,
  } as Parameters<typeof AsyncBody<RequestSummary>>[0]["query"];

  return (
    <section aria-label={t("requests.analytics.title")} className="mb-4">
      <AsyncBody query={query} skeletonRows={3}>
        {(summary) => <Figures summary={summary} asOf={pending.dataUpdatedAt} />}
      </AsyncBody>
      {(all.data?.length ?? 0) >= LOAD_CAP ? (
        <p className="m-0 mt-2 text-xs text-muted-text">
          {t("requests.analytics.capped", { count: formatCount(LOAD_CAP) })}
        </p>
      ) : null}
    </section>
  );
}
