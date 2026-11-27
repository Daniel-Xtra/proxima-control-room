import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { JobStatus } from "../api/systemApi";

export const JobStatusBadge = defineStatusBadge<JobStatus>({
  never: { tone: "neutral", label: t("jobs.cron.status.never") },
  running: { tone: "info", label: t("jobs.cron.status.running") },
  completed: { tone: "success", label: t("jobs.cron.status.completed") },
  failed: { tone: "danger", label: t("jobs.cron.status.failed") },
});
