import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { decideChange } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { PendingChange } from "../model/types";

interface Props {
  change: PendingChange;
  /** What the change is about, such as the fee name or the tier. */
  subject: string;
  /** Holds `config:approve`. */
  canDecide: boolean;
}

/** One change waiting for a second admin, with its approve and reject actions. */
export function PendingChangeNotice({ change, subject, canDecide }: Props) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  const own = change.makerId === user.id;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 text-sm font-semibold text-ink">
          <StatusBadge tone="warning" label={t("config.pending.badge")} />
          {subject}
        </p>
        {canDecide && !own ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeciding("reject")}>
              {t("config.pending.reject")}
            </Button>
            <Button onClick={() => setDeciding("approve")}>{t("config.pending.approve")}</Button>
          </div>
        ) : null}
      </div>
      <p className="m-0 text-xs text-ink">
        {t("config.pending.by", { name: change.makerName ?? t("common.notAvailable") })} ·{" "}
        <DateText iso={change.createdAt} />
      </p>
      <p className="m-0 text-xs text-ink">
        {t("config.pending.reason", { reason: change.reason })}
      </p>
      <ul className="m-0 list-disc pl-5 text-sm text-ink">
        {change.summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {own ? <p className="m-0 text-xs text-muted-text">{t("config.pending.own")}</p> : null}

      <ActionDialog
        open={deciding !== null}
        onOpenChange={(open) => !open && setDeciding(null)}
        title={
          deciding === "approve"
            ? t("config.pending.approve.title", { section: subject })
            : t("config.pending.reject.title", { section: subject })
        }
        impact={
          deciding === "approve"
            ? t("config.pending.approve.impact")
            : t("config.pending.reject.impact")
        }
        confirmLabel={
          deciding === "approve" ? t("config.pending.approve") : t("config.pending.reject")
        }
        destructive={deciding === "reject"}
        onConfirm={async ({ reason }) => {
          await decideChange(change.id, deciding === "approve", reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return deciding === "approve"
            ? t("config.pending.approved")
            : t("config.pending.rejected");
        }}
      />
    </div>
  );
}
