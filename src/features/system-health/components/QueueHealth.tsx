import { ArrowClockwise } from "@phosphor-icons/react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { formatCount, NO_VALUE } from "@/shared/lib/format";
import { getQueues, type Queue } from "../api/systemApi";
import { queueState, sortByAttention, type QueueState } from "../utils/queues";

const STATE_TONE = {
  stuck: "danger",
  failures: "danger",
  idle: "warning",
  working: "success",
  missing: "neutral",
} as const satisfies Record<QueueState, string>;

const number = (value: number | null) => (value === null ? NO_VALUE : formatCount(value));

export function QueueHealth() {
  const result = useApiQuery(["system", "queues"], getQueues);

  return (
    // A server that cannot reach the broker answers 503, which shows this rather than an empty list.
    <AsyncBody query={result} emptyTitle={t("jobs.queue.unavailable")}>
      {({ checkedAt, queues }) => {
        const total = (pick: (queue: Queue) => number | null) =>
          queues.reduce((sum, queue) => sum + (pick(queue) ?? 0), 0);
        const stuck = queues.filter((queue) => queueState(queue) === "stuck").length;
        return (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t("jobs.queue.stat.waiting")}
                value={formatCount(total((queue) => queue.waiting))}
              />
              <StatCard
                label={t("jobs.queue.stat.stuck")}
                value={formatCount(stuck)}
                tone={stuck > 0 ? "warning" : "default"}
              />
              <StatCard
                label={t("jobs.queue.stat.failed")}
                value={formatCount(total((queue) => queue.deadLetterWaiting))}
              />
            </div>
            <SectionCard
              title={t("jobs.tab.queues")}
              description={t("jobs.queue.description")}
              actions={
                <Button variant="outline" size="sm" onClick={() => void result.refetch()}>
                  <ArrowClockwise aria-hidden="true" />
                  {t("jobs.refresh")}
                </Button>
              }
              flush
            >
              <p className="m-0 border-b border-border-soft px-4 py-2 text-xs text-muted-text">
                {t("jobs.queue.checkedAt")} <DateText iso={checkedAt} />
              </p>
              <SimpleTable<Queue>
                storageKey="system-queues"
                caption={t("jobs.tab.queues")}
                rows={sortByAttention(queues)}
                getRowId={(queue) => queue.name}
                columns={[
                  {
                    key: "name",
                    header: t("jobs.queue.col.name"),
                    cell: (queue) => <span className="font-mono break-all">{queue.name}</span>,
                  },
                  {
                    key: "state",
                    header: t("jobs.col.status"),
                    cell: (queue) => {
                      const state = queueState(queue);
                      return (
                        <StatusBadge
                          tone={STATE_TONE[state]}
                          label={t(`jobs.queue.state.${state}`)}
                        />
                      );
                    },
                  },
                  {
                    key: "waiting",
                    header: t("jobs.queue.col.waiting"),
                    align: "right",
                    cell: (queue) => number(queue.waiting),
                  },
                  {
                    key: "consumers",
                    header: t("jobs.queue.col.consumers"),
                    align: "right",
                    cell: (queue) => number(queue.consumers),
                  },
                  {
                    key: "failed",
                    header: t("jobs.queue.col.failed"),
                    align: "right",
                    cell: (queue) =>
                      queue.deadLetterWaiting === null
                        ? t("jobs.queue.noFailedQueue")
                        : formatCount(queue.deadLetterWaiting),
                  },
                ]}
              />
            </SectionCard>
          </>
        );
      }}
    </AsyncBody>
  );
}
