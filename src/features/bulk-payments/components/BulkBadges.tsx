import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { BatchStatus, ItemStatus } from "../model/types";

export const BatchStatusBadge = defineStatusBadge<BatchStatus>({
  pending_approval: { tone: "warning", label: t("bulk.status.pending_approval") },
  scheduled: { tone: "info", label: t("bulk.status.scheduled") },
  completed: { tone: "success", label: t("bulk.status.completed") },
  partially_failed: { tone: "danger", label: t("bulk.status.partially_failed") },
  rejected: { tone: "neutral", label: t("bulk.status.rejected") },
});

export const ItemStatusBadge = defineStatusBadge<ItemStatus>({
  success: { tone: "success", label: t("bulk.item.success") },
  failed: { tone: "danger", label: t("bulk.item.failed") },
  pending: { tone: "warning", label: t("bulk.item.pending") },
});
