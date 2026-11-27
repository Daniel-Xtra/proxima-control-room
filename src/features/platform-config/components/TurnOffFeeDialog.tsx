import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { requestFeeTurnOff } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { FeeRule } from "../model/types";

interface Props {
  /** The rule to turn off. */
  fee: FeeRule;
  onClose: () => void;
}

/** Asks for a fee rule to be turned off. A second admin has to approve it. */
export function TurnOffFeeDialog({ fee, onClose }: Props) {
  const queryClient = useQueryClient();
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <ActionDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("config.fees.off.title")}
      description={fee.name}
      impact={t("config.fees.off.impact")}
      confirmLabel={t("config.submit")}
      destructive
      blocked={!acknowledged}
      onConfirm={async ({ reason }) => {
        await requestFeeTurnOff(fee.id, reason);
        await queryClient.invalidateQueries({ queryKey: configKeys.all });
        return t("config.submitted");
      }}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          id="fee-off-acknowledge"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <Label htmlFor="fee-off-acknowledge" className="pt-1.5">
          {t("config.fees.off.acknowledge")}
        </Label>
      </div>
    </ActionDialog>
  );
}
