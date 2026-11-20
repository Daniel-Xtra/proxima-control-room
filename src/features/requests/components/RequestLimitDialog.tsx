import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { createRequest } from "../api/requestsApi";
import { requestKeys } from "../api/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string; dailyLimitKobo: number; perTransactionLimitKobo: number };
}

const toKobo = (naira: string) => Math.round(Number(naira) * 100);

export function RequestLimitDialog({ open, onOpenChange, customer }: Props) {
  const queryClient = useQueryClient();
  const [daily, setDaily] = useState("");
  const [perTxn, setPerTxn] = useState("");
  const valid = toKobo(daily) > 0 && toKobo(perTxn) > 0 && toKobo(perTxn) <= toKobo(daily);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("requests.limit.title")}
      description={customer.name}
      impact={t("requests.limit.impact", { name: customer.name })}
      confirmLabel={t("requests.submit")}
      blocked={!valid}
      onConfirm={async ({ reason }) => {
        await createRequest({
          kind: "limit",
          customerId: customer.id,
          reason,
          limits: { dailyKobo: toKobo(daily), perTransactionKobo: toKobo(perTxn) },
        });
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        setDaily("");
        setPerTxn("");
        return t("requests.submitted");
      }}
    >
      <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-muted p-3 text-sm">
        <div>
          <dt className="text-xs text-muted-text">{t("requests.limit.currentDaily")}</dt>
          <dd>
            <MoneyText kobo={customer.dailyLimitKobo} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-text">{t("requests.limit.currentPerTxn")}</dt>
          <dd>
            <MoneyText kobo={customer.perTransactionLimitKobo} />
          </dd>
        </div>
      </dl>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="req-daily">{t("requests.limit.newDaily")}</Label>
          <Input
            id="req-daily"
            inputMode="decimal"
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="req-txn">{t("requests.limit.newPerTxn")}</Label>
          <Input
            id="req-txn"
            inputMode="decimal"
            value={perTxn}
            onChange={(e) => setPerTxn(e.target.value)}
          />
        </div>
      </div>
      {daily && perTxn && !valid ? (
        <p role="alert" className="text-sm text-danger-text">
          {t("requests.limit.invalid")}
        </p>
      ) : null}
    </ActionDialog>
  );
}
