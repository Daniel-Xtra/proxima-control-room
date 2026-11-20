import { useQueryClient } from "@tanstack/react-query";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { t } from "@/shared/i18n/t";
import { createRequest } from "../api/requestsApi";
import { requestKeys } from "../api/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string; frozen: boolean };
}

/** Maker step: staff raise the request, confirm with their authenticator, status becomes pending. */
export function RequestFreezeDialog({ open, onOpenChange, customer }: Props) {
  const queryClient = useQueryClient();
  const kind = customer.frozen ? "unfreeze" : "freeze";

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customer.frozen ? t("requests.unfreeze.title") : t("requests.freeze.title")}
      description={customer.name}
      impact={
        customer.frozen
          ? t("requests.unfreeze.impact", { name: customer.name })
          : t("requests.freeze.impact", { name: customer.name })
      }
      confirmLabel={t("requests.submit")}
      destructive={!customer.frozen}
      onConfirm={async ({ reason }) => {
        await createRequest({
          kind,
          customerId: customer.id,
          reason,
        });
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        return t("requests.submitted");
      }}
    />
  );
}
