import { ArrowClockwise } from "@phosphor-icons/react";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { NO_VALUE } from "@/shared/lib/format";
import { getScheduledJobs, type ScheduledJob } from "../api/systemApi";
import { describeSchedule, formatDuration } from "../utils/schedule";
import { JobStatusBadge } from "./JobStatusBadge";

const when = (iso: string | null) => (iso ? <DateText iso={iso} /> : NO_VALUE);

export function ScheduledJobs() {
  const result = useApiQuery(["system", "cron"], getScheduledJobs);

  return (
    <SectionCard
      title={t("jobs.tab.scheduled")}
      description={t("jobs.cron.description")}
      actions={
        <Button variant="outline" size="sm" onClick={() => void result.refetch()}>
          <ArrowClockwise aria-hidden="true" />
          {t("jobs.refresh")}
        </Button>
      }
      flush
    >
      <AsyncBody query={result}>
        {({ jobs }) => (
          <SimpleTable<ScheduledJob>
            storageKey="system-cron"
            caption={t("jobs.tab.scheduled")}
            rows={jobs}
            getRowId={(job) => job.key}
            columns={[
              { key: "name", header: t("jobs.cron.col.job"), cell: (job) => job.name },
              {
                key: "schedule",
                header: t("jobs.cron.col.schedule"),
                cell: (job) => describeSchedule(job.schedule),
              },
              {
                key: "status",
                header: t("jobs.cron.col.lastRun"),
                cell: (job) => <JobStatusBadge status={job.status} />,
              },
              {
                key: "started",
                header: t("jobs.cron.col.started"),
                cell: (job) => when(job.lastStartedAt),
              },
              {
                key: "duration",
                header: t("jobs.cron.col.duration"),
                cell: (job) =>
                  job.lastDurationMs === null || job.status === "running"
                    ? NO_VALUE
                    : formatDuration(job.lastDurationMs),
              },
              {
                key: "succeeded",
                header: t("jobs.cron.col.succeeded"),
                cell: (job) => when(job.lastSucceededAt),
              },
              {
                key: "error",
                header: t("jobs.col.error"),
                cell: (job) => <span className="break-words">{job.lastError ?? NO_VALUE}</span>,
              },
            ]}
          />
        )}
      </AsyncBody>
    </SectionCard>
  );
}
