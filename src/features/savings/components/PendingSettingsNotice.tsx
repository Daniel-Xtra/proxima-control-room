import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { decideSettingsChange } from "../api/settingsApi";
import { savingsSettingsKeys } from "../api/settingsQueries";
import type { PendingSettingsChange } from "../model/settingsTypes";

interface Props {
  change: PendingSettingsChange;
  /** What the change is about, such as the term or the product name. */
  subject: string;
  /** Holds the permission to approve savings settings. */
  canDecide: boolean;
}

/** One change waiting for a second admin, with its approve and reject actions. */
export function PendingSettingsNotice({ change, subject, canDecide }: Props) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  const own = change.makerId === user.id;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 text-sm font-semibold text-ink">
          <StatusBadge tone="warning" label={t("savingsSettings.pending.badge")} />
          {subject}
        </p>
        {canDecide && !own ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeciding("reject")}>
              {t("savingsSettings.pending.reject")}
            </Button>
            <Button onClick={() => setDeciding("approve")}>
              {t("savingsSettings.pending.approve")}
            </Button>
          </div>
        ) : null}
      </div>
      <p className="m-0 text-xs text-ink">
        {t("savingsSettings.pending.by", { name: change.makerName ?? t("common.notAvailable") })} ·{" "}
        <DateText iso={change.createdAt} />
      </p>
      <p className="m-0 text-xs text-ink">
        {t("savingsSettings.pending.reason", { reason: change.reason })}
      </p>
      <ul className="m-0 list-disc pl-5 text-sm text-ink">
        {change.summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {own ? (
        <p className="m-0 text-xs text-muted-text">{t("savingsSettings.pending.own")}</p>
      ) : null}

      <ActionDialog
        open={deciding !== null}
        onOpenChange={(open) => !open && setDeciding(null)}
        title={
          deciding === "approve"
            ? t("savingsSettings.pending.approve.title")
            : t("savingsSettings.pending.reject.title")
        }
        description={subject}
        impact={
          deciding === "approve"
            ? t("savingsSettings.pending.approve.impact")
            : t("savingsSettings.pending.reject.impact")
        }
        confirmLabel={
          deciding === "approve"
            ? t("savingsSettings.pending.approve")
            : t("savingsSettings.pending.reject")
        }
        destructive={deciding === "reject"}
        onConfirm={async ({ reason }) => {
          await decideSettingsChange(change.id, deciding === "approve", reason);
          await queryClient.invalidateQueries({ queryKey: savingsSettingsKeys.all });
          return deciding === "approve"
            ? t("savingsSettings.pending.approved")
            : t("savingsSettings.pending.rejected");
        }}
      />
    </div>
  );
}
