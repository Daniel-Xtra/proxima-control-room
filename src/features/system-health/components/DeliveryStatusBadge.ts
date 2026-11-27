import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { DeliveryStatus } from "../api/systemApi";

export const DeliveryStatusBadge = defineStatusBadge<DeliveryStatus>({
  dead: { tone: "danger", label: t("jobs.delivery.status.dead") },
  stuck: { tone: "danger", label: t("jobs.delivery.status.stuck") },
  failed: { tone: "warning", label: t("jobs.delivery.status.failed") },
  published: { tone: "info", label: t("jobs.delivery.status.published") },
  pending: { tone: "neutral", label: t("jobs.delivery.status.pending") },
  publishing: { tone: "info", label: t("jobs.delivery.status.publishing") },
  delivered: { tone: "success", label: t("jobs.delivery.status.delivered") },
});
