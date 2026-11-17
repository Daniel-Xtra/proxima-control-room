import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { Timeline, type TimelineEntry } from "@/shared/components/Timeline";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { formatCount, formatLagos } from "@/shared/lib/format";
import { decideBatch, retryFailed } from "../api/bulkApi";
import { bulkKeys, useBatch } from "../api/queries";
import { BatchStatusBadge, ItemStatusBadge } from "../components/BulkBadges";
import { summarize, type BulkBatch, type BulkItem } from "../model/types";

export function BulkPaymentDetailPage() {
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
  const summary = summarize(batch.items);
  const debitKobo = summary.totalKobo + summary.feeKobo;

  const isOwn = batch.createdBy === user.name;
  const overCeiling = debitKobo > user.approvalCeilingKobo;
  const blockedReason = isOwn
    ? t("bulk.detail.selfBlocked")
    : overCeiling
      ? t("bulk.detail.ceilingBlocked")
      : undefined;
  const pending = batch.status === "pending_approval";
  const canDecide = pending && can("bulk_payment:approve");
  const canRetry = batch.status === "partially_failed" && can("bulk_payment:approve");
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
        description={t("bulk.detail.subtitle", { source: batch.sourceAccount })}
        crumbs={[
          { label: t("nav.group.payments") },
          { label: t("bulk.title"), to: "/bulk-payments" },
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label={t("bulk.stat.payees")} value={formatCount(summary.itemCount)} />
          <StatCard label={t("bulk.stat.total")} value={<MoneyText kobo={summary.totalKobo} />} />
          <StatCard label={t("bulk.stat.fees")} value={<MoneyText kobo={summary.feeKobo} />} />
          <StatCard
            label={t("bulk.stat.succeeded")}
            value={formatCount(summary.successCount)}
            tone="success"
          />
          <StatCard
            label={t("bulk.stat.failed")}
            value={formatCount(summary.failedCount)}
            tone={summary.failedCount > 0 ? "danger" : "default"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title={t("bulk.section.payees")} flush className="lg:col-span-2">
            <SimpleTable<BulkItem>
              caption={t("bulk.section.payees")}
              rows={batch.items}
              getRowId={(item) => item.id}
              columns={[
                {
                  key: "row",
                  header: t("bulk.col.row"),
                  sortValue: (i) => i.row,
                  cell: (i) => i.row,
                },
                {
                  key: "name",
                  header: t("bulk.col.accountName"),
                  sortValue: (i) => i.accountName,
                  cell: (i) => i.accountName,
                },
                {
                  key: "account",
                  header: t("bulk.col.accountNumber"),
                  cell: (i) => <span className="tabular-nums">{i.accountNumber}</span>,
                },
                {
                  key: "bank",
                  header: t("bulk.col.bank"),
                  sortValue: (i) => i.bank,
                  cell: (i) => i.bank,
                },
                {
                  key: "amount",
                  header: t("bulk.col.amount"),
                  align: "right",
                  sortValue: (i) => i.amountKobo,
                  cell: (i) => <MoneyText kobo={i.amountKobo} />,
                },
                {
                  key: "status",
                  header: t("bulk.col.status"),
                  sortValue: (i) => i.status,
                  cell: (i) => <ItemStatusBadge status={i.status} />,
                },
                {
                  key: "reason",
                  header: t("bulk.col.failure"),
                  cell: (i) => i.failureReason ?? t("common.notAvailable"),
                },
              ]}
            />
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title={t("bulk.section.summary")}>
              <KeyValueList
                columns={1}
                items={[
                  { label: t("bulk.field.source"), value: batch.sourceAccount },
                  { label: t("bulk.stat.debit"), value: <MoneyText kobo={debitKobo} /> },
                  {
                    label: t("bulk.field.timing"),
                    value: batch.scheduledFor
                      ? formatLagos(batch.scheduledFor)
                      : t("bulk.timing.onApproval"),
                  },
                  { label: t("bulk.col.createdBy"), value: batch.createdBy },
                  { label: t("bulk.col.created"), value: formatLagos(batch.createdAt) },
                ]}
              />
            </SectionCard>
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
                  count: summary.itemCount,
                  when: formatLagos(batch.scheduledFor),
                })
              : t("bulk.approve.impact", { count: summary.itemCount })
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
        impact={t("bulk.retry.impact", { count: summary.failedCount })}
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
