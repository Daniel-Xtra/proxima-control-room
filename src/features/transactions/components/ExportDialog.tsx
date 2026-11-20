import { saveFile } from "@/shared/api/client";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { t } from "@/shared/i18n/t";
import { exportTransactions } from "../api/transactionsApi";
import type { TransactionFilters } from "../model/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Pick<TransactionFilters, "search" | "range" | "status" | "purpose" | "customerId">;
}

/** Downloads the transactions that match the current filters. Needs a reason and a fresh code. */
export function ExportDialog({ open, onOpenChange, filters }: Props) {
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("transactions.export.title")}
      impact={t("transactions.export.impact")}
      confirmLabel={t("transactions.export.confirm")}
      onConfirm={async ({ reason }) => {
        saveFile(await exportTransactions(filters, reason));
        return t("transactions.export.done");
      }}
    />
  );
}
