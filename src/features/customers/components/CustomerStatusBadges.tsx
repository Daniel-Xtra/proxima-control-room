import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { t } from "@/shared/i18n/t";
import type { ComplianceStatus, CustomerStatus, KycLevel, UpgradeStatus } from "../model/types";

export const CustomerStatusBadge = defineStatusBadge<CustomerStatus>({
  active: { tone: "success", label: t("customers.status.active") },
  deactivated: { tone: "neutral", label: t("customers.status.deactivated") },
  locked: { tone: "locked", label: t("customers.status.locked") },
  frozen: { tone: "locked", label: t("customers.status.frozen") },
});

export const ComplianceStatusBadge = defineStatusBadge<ComplianceStatus>({
  draft: { tone: "neutral", label: t("kyc.status.draft") },
  pending: { tone: "warning", label: t("kyc.status.pending") },
  approved: { tone: "success", label: t("kyc.status.approved") },
  rejected: { tone: "danger", label: t("kyc.status.rejected") },
  resubmitted: { tone: "warning", label: t("kyc.status.resubmitted") },
});

export function KycLevelBadge({ level }: { level: KycLevel }) {
  if (level === 0) return <StatusBadge tone="neutral" label={t("kyc.level.none")} />;
  return (
    <StatusBadge tone={level === 2 ? "success" : "info"} label={t("kyc.level.n", { level })} />
  );
}

export const UpgradeStatusBadge = defineStatusBadge<UpgradeStatus>({
  pending: { tone: "warning", label: t("customers.upgrade.status.pending") },
  resubmitted: { tone: "info", label: t("customers.upgrade.status.resubmitted") },
  approved: { tone: "success", label: t("customers.upgrade.status.approved") },
  rejected: { tone: "danger", label: t("customers.upgrade.status.rejected") },
});
