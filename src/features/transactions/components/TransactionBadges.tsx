import { ArrowDownLeft, ArrowUpRight } from "@phosphor-icons/react";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { TransactionDirection, TransactionStatus } from "../model/types";

export const TransactionStatusBadge = defineStatusBadge<TransactionStatus>({
  success: { tone: "success", label: t("transactions.status.success") },
  pending: { tone: "warning", label: t("transactions.status.pending") },
  failed: { tone: "danger", label: t("transactions.status.failed") },
});

export function DirectionChip({ direction }: { direction: TransactionDirection }) {
  const credit = direction === "credit";
  const Glyph = credit ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${credit ? "text-success" : "text-ink"}`}
    >
      <Glyph aria-hidden="true" className="size-3.5" />
      {credit ? t("transactions.credit") : t("transactions.debit")}
    </span>
  );
}
