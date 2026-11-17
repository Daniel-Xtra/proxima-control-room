import { Copy } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Can } from "@/features/auth";
import { requestKeys } from "@/features/requests";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { requeryTransaction, requestRefund, requestReversal } from "../api/transactionsApi";
import { transactionKeys, useTransactionDetail } from "../api/queries";
import type { Transaction, TransactionDetail } from "../model/types";
import { purposeLabel } from "@/shared/lib/purposeLabel";
import { DirectionChip, TransactionStatusBadge } from "./TransactionBadges";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

type Action = "requery" | "reverse" | "refund" | null;

export function TransactionDrawer({ transaction, onClose }: Props) {
  const detail = useTransactionDetail(transaction?.reference ?? null);

  return (
    <DetailsSheet
      open={transaction !== null}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={t("transactions.detail.title")}
      description={transaction?.reference}
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
              { label: t("transactions.col.purpose"), value: purposeLabel(transaction.purpose) },
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
          <AsyncBody query={detail} skeletonRows={3}>
            {(data) => <DetailSections transaction={transaction} data={data} onDone={onClose} />}
          </AsyncBody>
        </div>
      ) : null}
    </DetailsSheet>
  );
}

function DetailSections({
  transaction,
  data,
  onDone,
}: {
  transaction: Transaction;
  data: TransactionDetail;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const [refund, setRefund] = useState("");
  const provider = data.provider;
  const refundKobo = Math.round(Number(refund) * 100);

  async function refresh(requests: boolean) {
    await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    if (requests) await queryClient.invalidateQueries({ queryKey: requestKeys.all });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transaction.status === "pending" && provider ? (
          <Can permission="transaction:requery">
            <Button variant="outline" onClick={() => setAction("requery")}>
              {t("transactions.action.requery")}
            </Button>
          </Can>
        ) : null}
        {transaction.status === "failed" ? (
          <Can permission="transaction:reverse">
            <Button variant="destructive" onClick={() => setAction("reverse")}>
              {t("transactions.action.reverse")}
            </Button>
          </Can>
        ) : null}
        {transaction.status === "success" ? (
          <Can permission="transaction:refund">
            <Button variant="outline" onClick={() => setAction("refund")}>
              {t("transactions.action.refund")}
            </Button>
          </Can>
        ) : null}
      </div>

      {provider ? (
        <div className="flex flex-col gap-3">
          <KeyValueList
            columns={1}
            items={[
              {
                label: t("transactions.provider.processor"),
                value: provider.processor ?? t("common.notAvailable"),
              },
              {
                label: t("transactions.provider.message"),
                value: provider.message ?? t("common.notAvailable"),
              },
              ...Object.entries(provider.details).map(([key, value]) => ({
                label: t(`transactions.provider.${key}` as "transactions.provider.bank"),
                value,
              })),
            ]}
          />
          {provider.rawResponse !== undefined && provider.rawResponse !== null ? (
            <details className="rounded-md border border-border-soft">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {t("transactions.detail.provider")}
              </summary>
              <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all border-t border-border-soft p-3 text-xs">
                {typeof provider.rawResponse === "string"
                  ? provider.rawResponse
                  : JSON.stringify(provider.rawResponse, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {data.entries.some((entry) => entry.metadata) ? (
        <details className="rounded-md border border-border-soft">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
            {t("transactions.detail.metadata")}
          </summary>
          <pre className="m-0 overflow-x-auto border-t border-border-soft p-3 text-xs">
            {JSON.stringify(
              data.entries.map((entry) => entry.metadata),
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}

      <ActionDialog
        open={action === "requery"}
        onOpenChange={(open) => !open && setAction(null)}
        title={t("transactions.action.requery")}
        description={transaction.reference}
        impact={t("transactions.requery.impact")}
        confirmLabel={t("transactions.action.requery")}
        requireReason={false}
        onConfirm={async () => {
          if (!provider) throw new Error("No provider record");
          const result = await requeryTransaction(provider.kind, transaction.reference);
          await refresh(false);
          onDone();
          return result.skipped_terminal
            ? t("transactions.requery.final")
            : t("transactions.requery.done");
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
        onConfirm={async ({ reason }) => {
          await requestReversal(transaction.reference, reason);
          await refresh(true);
          onDone();
          return t("transactions.reverse.done");
        }}
      />
      <ActionDialog
        open={action === "refund"}
        onOpenChange={(open) => !open && setAction(null)}
        title={t("transactions.action.refund")}
        description={transaction.reference}
        impact={t("transactions.refund.impact", { name: transaction.customerName })}
        confirmLabel={t("transactions.action.refund")}
        blocked={!(refundKobo > 0 && refundKobo <= transaction.amountKobo)}
        onConfirm={async ({ reason }) => {
          await requestRefund(transaction.reference, refundKobo, data.unit, reason);
          await refresh(true);
          setRefund("");
          onDone();
          return t("transactions.refund.done");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refund-amount">{t("transactions.refund.amount")}</Label>
          <Input
            id="refund-amount"
            inputMode="decimal"
            value={refund}
            onChange={(event) => setRefund(event.target.value)}
          />
          <p className="text-xs text-muted-text">
            {t("transactions.refund.max")} <MoneyText kobo={transaction.amountKobo} />
          </p>
        </div>
      </ActionDialog>
    </>
  );
}
