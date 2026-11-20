import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { RequestStatus } from "../model/types";

export const RequestStatusBadge = defineStatusBadge<RequestStatus>({
  pending: { tone: "warning", label: t("requests.status.pending") },
  approved: { tone: "success", label: t("requests.status.approved") },
  rejected: { tone: "danger", label: t("requests.status.rejected") },
  cancelled: { tone: "neutral", label: t("requests.status.cancelled") },
  expired: { tone: "neutral", label: t("requests.status.expired") },
  failed: { tone: "danger", label: t("requests.status.failed") },
});
