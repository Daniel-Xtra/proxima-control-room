import { Copy } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Can } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { requeryTransaction, reverseTransaction } from "../api/transactionsApi";
import { transactionKeys } from "../api/queries";
import type { Transaction } from "../model/types";
import { DirectionChip, TransactionStatusBadge } from "./TransactionBadges";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDrawer({ transaction, onClose }: Props) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"requery" | "reverse" | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    onClose();
  }

  return (
    <>
      <DetailsSheet
        open={transaction !== null}
        onOpenChange={(open) => !open && onClose()}
        size="md"
        title={t("transactions.detail.title")}
        description={transaction?.reference}
        action={
          transaction ? (
            <>
              {transaction.status === "pending" ? (
                <Can permission="transaction:requery">
                  <Button variant="outline" onClick={() => setAction("requery")}>
                    {t("transactions.action.requery")}
                  </Button>
                </Can>
              ) : null}
              {transaction.status === "success" ? (
                <Can permission="transaction:reverse">
                  <Button variant="destructive" onClick={() => setAction("reverse")}>
                    {t("transactions.action.reverse")}
                  </Button>
                </Can>
              ) : null}
            </>
          ) : null
        }
      >
        {transaction ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <TransactionStatusBadge status={transaction.status} />
              <DirectionChip direction={transaction.direction} />
              <Button
                variant="ghost"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(transaction.reference)
                    .then(() => toast.success(t("transactions.detail.copied")))
                }
              >
                <Copy aria-hidden="true" />
                {t("transactions.detail.copyReference")}
              </Button>
            </div>
            <KeyValueList
              columns={1}
              items={[
                { label: t("transactions.col.customer"), value: transaction.customerName },
                {
                  label: t("transactions.col.purpose"),
                  value: t(`purpose.${transaction.purpose}`),
                },
                {
                  label: t("transactions.col.amount"),
                  value: <MoneyText kobo={transaction.amountKobo} />,
                },
                {
                  label: t("transactions.detail.before"),
                  value: <MoneyText kobo={transaction.balanceBeforeKobo} />,
                },
                {
                  label: t("transactions.detail.after"),
                  value: <MoneyText kobo={transaction.balanceAfterKobo} />,
                },
                { label: t("transactions.detail.narration"), value: transaction.narration },
                {
                  label: t("transactions.col.date"),
                  value: <DateText iso={transaction.createdAt} />,
                },
              ]}
            />
            <details className="rounded-md border border-border-soft">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {t("transactions.detail.metadata")}
              </summary>
              <pre className="m-0 overflow-x-auto border-t border-border-soft p-3 text-xs">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </details>
            <details className="rounded-md border border-border-soft">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {t("transactions.detail.provider")}
              </summary>
              <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all border-t border-border-soft p-3 text-xs">
                {transaction.providerResponse}
              </pre>
            </details>
          </div>
        ) : null}
      </DetailsSheet>

      {transaction ? (
        <>
          <ActionDialog
            open={action === "requery"}
            onOpenChange={(open) => !open && setAction(null)}
            title={t("transactions.action.requery")}
            description={transaction.reference}
            impact={t("transactions.requery.impact")}
            confirmLabel={t("transactions.action.requery")}
            requireTotp={false}
            onConfirm={async ({ reason }) => {
              await requeryTransaction(transaction.reference, reason);
              await refresh();
              return t("transactions.requery.done");
            }}
          />
          <ActionDialog
            open={action === "reverse"}
            onOpenChange={(open) => !open && setAction(null)}
            title={t("transactions.action.reverse")}
            description={transaction.reference}
            impact={t("transactions.reverse.impact", { name: transaction.customerName })}
            confirmLabel={t("transactions.action.reverse")}
            destructive
            typedConfirmation
            onConfirm={async ({ reason }) => {
              await reverseTransaction(transaction.reference, reason);
              await refresh();
              return t("transactions.reverse.done");
            }}
          />
        </>
      ) : null}
    </>
  );
}
