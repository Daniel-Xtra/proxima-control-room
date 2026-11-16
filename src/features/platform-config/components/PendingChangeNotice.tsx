import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getAuditActor } from "@/shared/api/auditStore";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { decideChange } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { Section } from "../model/types";

interface Props {
  section: Section;
  proposedBy: string;
  proposedAt: string;
  reason: string;
  /** What would change, one line per row. */
  changes: string[];
  /** Holds `config:approve`. */
  canDecide: boolean;
}

/** A proposed change waiting for a second person. The proposer can see it but not decide it. */
export function PendingChangeNotice({
  section,
  proposedBy,
  proposedAt,
  reason,
  changes,
  canDecide,
}: Props) {
  const queryClient = useQueryClient();
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  const own = proposedBy === getAuditActor();
  const sectionName = t(`config.section.${section}`);

  return (
    <div className="card flex flex-col gap-2 border-warning-text/40 bg-warning-bg p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 font-medium text-ink">
          <StatusBadge tone="warning" label={t("config.pending.badge")} />
          {t("config.pending.title", { section: sectionName })}
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
      <p className="m-0 text-xs text-muted-text">
        {t("config.pending.by", { name: proposedBy })} · <DateText iso={proposedAt} />
      </p>
      <p className="m-0 text-xs text-ink">{t("config.pending.reason", { reason })}</p>
      <ul className="m-0 list-disc pl-4 text-xs text-ink">
        {changes.length > 0 ? (
          changes.map((line) => <li key={line}>{line}</li>)
        ) : (
          <li>{t("config.pending.noChange")}</li>
        )}
      </ul>
      {own ? <p className="m-0 text-xs text-muted-text">{t("config.pending.own")}</p> : null}

      <ActionDialog
        open={deciding !== null}
        onOpenChange={(open) => !open && setDeciding(null)}
        title={
          deciding === "approve"
            ? t("config.pending.approve.title", { section: sectionName })
            : t("config.pending.reject.title", { section: sectionName })
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
        onConfirm={async ({ reason: note }) => {
          await decideChange(section, deciding === "approve", note);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return deciding === "approve"
            ? t("config.pending.approved")
            : t("config.pending.rejected");
        }}
      />
    </div>
  );
}
