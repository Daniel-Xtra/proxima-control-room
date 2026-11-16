import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
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
  const [comment, setComment] = useState("");
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
          customerName: customer.name,
          reason,
          staffComment: comment,
        });
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        setComment("");
        return t("requests.submitted");
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staff-comment">{t("requests.staffComment")}</Label>
        <Input
          id="staff-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("requests.staffCommentPlaceholder")}
        />
      </div>
    </ActionDialog>
  );
}
