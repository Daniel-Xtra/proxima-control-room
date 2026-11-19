import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { Timeline, type TimelineEntry } from "@/shared/components/Timeline";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { formatLagos } from "@/shared/lib/format";
import { decideBatch, retryFailed } from "../api/bulkApi";
import { bulkKeys, useBatch, useSourceName } from "../api/queries";
import { BatchOverview } from "../components/BatchOverview";
import { BatchPayeesTable } from "../components/BatchPayeesTable";
import { BatchStatusBadge } from "../components/BulkBadges";
import type { BulkBatch } from "../model/types";

export function BulkTransferDetailPage() {
  const { id = "" } = useParams();
  const query = useBatch(id);
  return <AsyncBody query={query}>{(batch) => <BatchDetail batch={batch} />}</AsyncBody>;
}

function BatchDetail({ batch }: { batch: BulkBatch }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const [dialog, setDialog] = useState<"approved" | "rejected" | "retry" | null>(null);
  const [openedAt] = useState(() => Date.now());
  const sourceName = useSourceName(batch.sourceAccount);
  const debitKobo = batch.totalKobo + batch.feeKobo;

  const isOwn = batch.createdBy === user.name;
  const overCeiling = debitKobo > user.approvalCeilingKobo;
  const blockedReason = isOwn
    ? t("bulk.detail.selfBlocked")
    : overCeiling
      ? t("bulk.detail.ceilingBlocked")
      : undefined;
  const pending = batch.status === "pending_approval";
  const canDecide = pending && can("bulk_transfer:approve");
  const canRetry = batch.status === "partially_failed" && can("bulk_transfer:approve");
  const refresh = () => queryClient.invalidateQueries({ queryKey: bulkKeys.all });

  const activity: TimelineEntry[] = [
    {
      id: "created",
      title: t("bulk.activity.created"),
      detail: batch.reason,
      at: batch.createdAt,
      actor: batch.createdBy,
    },
    ...(batch.decidedAt
      ? [
          {
            id: "decided",
            title:
              batch.status === "rejected"
                ? t("bulk.activity.rejected")
                : t("bulk.activity.approved"),
            detail: batch.decisionComment,
            at: batch.decidedAt,
            actor: batch.decidedBy,
          },
        ]
      : []),
  ].reverse();

  return (
    <>
      <PageHeader
        title={batch.name}
        description={t("bulk.detail.subtitle", {
          source: sourceName,
          when: batch.scheduledFor ? formatLagos(batch.scheduledFor) : t("bulk.timing.onApproval"),
        })}
        crumbs={[
          { label: t("nav.group.payments") },
          { label: t("bulk.title"), to: "/bulk-transfers" },
          { label: batch.name },
        ]}
        meta={<BatchStatusBadge status={batch.status} />}
        actions={
          <>
            {canDecide ? (
              <>
                <Button
                  variant="outline"
                  disabled={Boolean(blockedReason)}
                  onClick={() => setDialog("rejected")}
                >
                  {t("bulk.reject")}
                </Button>
                <Button disabled={Boolean(blockedReason)} onClick={() => setDialog("approved")}>
                  {t("bulk.approve")}
                </Button>
              </>
            ) : null}
            {canRetry ? (
              <Button onClick={() => setDialog("retry")}>{t("bulk.retry")}</Button>
            ) : null}
          </>
        }
      />

      {canDecide && blockedReason ? (
        <output className="mb-4 block rounded-md bg-warning-bg p-3 text-sm text-warning-text">
          {blockedReason}
        </output>
      ) : null}

      <div className="flex flex-col gap-4">
        <BatchOverview batch={batch} />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <BatchPayeesTable batch={batch} />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard title={t("bulk.section.activity")}>
              <Timeline entries={activity} />
            </SectionCard>
          </div>
        </div>
      </div>

      <ActionDialog
        open={dialog === "approved" || dialog === "rejected"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "approved" ? t("bulk.approve") : t("bulk.reject")}
        description={batch.name}
        impact={
          dialog === "approved"
            ? batch.scheduledFor && new Date(batch.scheduledFor).getTime() > openedAt
              ? t("bulk.approve.impactScheduled", {
                  count: batch.itemCount,
                  when: formatLagos(batch.scheduledFor),
                })
              : t("bulk.approve.impact", { count: batch.itemCount })
            : t("bulk.reject.impact")
        }
        confirmLabel={dialog === "approved" ? t("bulk.approve") : t("bulk.reject")}
        destructive={dialog === "rejected"}
        onConfirm={async ({ reason }) => {
          await decideBatch({
            id: batch.id,
            decision: dialog === "approved" ? "approved" : "rejected",
            comment: reason,
          });
          await refresh();
          return dialog === "approved" ? t("bulk.approve.done") : t("bulk.reject.done");
        }}
      />
      <ActionDialog
        open={dialog === "retry"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("bulk.retry")}
        description={batch.name}
        impact={t("bulk.retry.impact", { count: batch.counts.failed })}
        confirmLabel={t("bulk.retry")}
        onConfirm={async ({ reason }) => {
          await retryFailed(batch.id, reason);
          await refresh();
          return t("bulk.retry.done");
        }}
      />
    </>
  );
}
