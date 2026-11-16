import { useQueryClient } from "@tanstack/react-query";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { t } from "@/shared/i18n/t";
import { liquidateFixedDeposit, liquidateTargetSaving } from "../api/savingsApi";
import { savingsKeys, useBreakagePreview } from "../api/queries";

export interface LiquidationTarget {
  id: string;
  kind: "fixed" | "target";
  customerName: string;
}

interface Props {
  target: LiquidationTarget | null;
  onClose: () => void;
}

export function LiquidateDialog({ target, onClose }: Props) {
  const queryClient = useQueryClient();
  const preview = useBreakagePreview(target?.id ?? null);

  return (
    <ActionDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t("savings.liquidate.title")}
      description={target?.customerName}
      impact={t("savings.liquidate.impact")}
      confirmLabel={t("savings.liquidate.confirm")}
      typedConfirmation
      destructive
      blocked={!preview.data}
      onConfirm={async ({ reason }) => {
        if (!target) return "";
        if (target.kind === "fixed") await liquidateFixedDeposit(target.id, reason);
        else await liquidateTargetSaving(target.id, reason);
        await queryClient.invalidateQueries({ queryKey: savingsKeys.all });
        return t("savings.liquidate.done");
      }}
    >
      <div className="rounded-md border border-border p-3">
        <h3 className="mb-2 text-sm font-semibold">{t("savings.liquidate.preview")}</h3>
        {preview.data ? (
          <KeyValueList
            items={[
              {
                label: t("savings.col.principal"),
                value: <MoneyText kobo={preview.data.principalKobo} />,
              },
              {
                label: t("savings.liquidate.interest"),
                value: <MoneyText kobo={preview.data.accruedInterestKobo} />,
              },
              {
                label: t("savings.liquidate.fee"),
                value: (
                  <MoneyText kobo={preview.data.breakageFeeKobo} className="text-danger-text" />
                ),
              },
              {
                label: t("savings.liquidate.payout"),
                value: <MoneyText kobo={preview.data.payoutKobo} className="font-semibold" />,
              },
            ]}
          />
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </div>
    </ActionDialog>
  );
}
