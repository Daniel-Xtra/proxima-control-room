import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { BatchStatus, ItemStatus } from "../model/types";

export const BatchStatusBadge = defineStatusBadge<BatchStatus>({
  pending_funding: { tone: "warning", label: t("bulk.status.pending_funding") },
  pending_approval: { tone: "warning", label: t("bulk.status.pending_approval") },
  approved: { tone: "info", label: t("bulk.status.approved") },
  processing: { tone: "info", label: t("bulk.status.processing") },
  reconciling: { tone: "info", label: t("bulk.status.reconciling") },
  completed: { tone: "success", label: t("bulk.status.completed") },
  partially_failed: { tone: "danger", label: t("bulk.status.partially_failed") },
  failed: { tone: "danger", label: t("bulk.status.failed") },
  rejected: { tone: "neutral", label: t("bulk.status.rejected") },
  cancelled: { tone: "neutral", label: t("bulk.status.cancelled") },
});

export const ItemStatusBadge = defineStatusBadge<ItemStatus>({
  success: { tone: "success", label: t("bulk.item.success") },
  failed: { tone: "danger", label: t("bulk.item.failed") },
  pending: { tone: "warning", label: t("bulk.item.pending") },
  processing: { tone: "info", label: t("bulk.item.processing") },
  unknown: { tone: "warning", label: t("bulk.item.unknown") },
});
