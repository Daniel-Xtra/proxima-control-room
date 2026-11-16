import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { Timeline, type TimelineEntry } from "@/shared/components/Timeline";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { formatCount, formatLagos } from "@/shared/lib/format";
import { decideBroadcast } from "../api/broadcastsApi";
import { broadcastKeys, useBroadcast } from "../api/queries";
import {
  BroadcastStatusBadge,
  ChannelLabel,
  DeliveryStatusBadge,
} from "../components/BroadcastBadges";
import { MessagePreview } from "../components/MessagePreview";
import type { Broadcast, DeliveryRecord } from "../model/types";

export function BroadcastDetailPage() {
  const { id = "" } = useParams();
  const query = useBroadcast(id);
  return <AsyncBody query={query}>{(broadcast) => <Detail broadcast={broadcast} />}</AsyncBody>;
}

function Detail({ broadcast }: { broadcast: Broadcast }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const [dialog, setDialog] = useState<"approved" | "rejected" | null>(null);
  // Read once, so the "sends later" wording does not flip while the dialog is open.
  const [openedAt] = useState(() => Date.now());

  const pending = broadcast.status === "pending_approval";
  const isOwn = broadcast.createdBy === user.name;
  const canDecide = pending && can("content:publish");
  const sent = broadcast.status === "sent";
  const later = broadcast.scheduledFor && new Date(broadcast.scheduledFor).getTime() > openedAt;
  const rate = broadcast.recipientCount
    ? Math.round((broadcast.delivered / broadcast.recipientCount) * 1000) / 10
    : 0;

  const activity: TimelineEntry[] = [
    {
      id: "created",
      title: t("broadcasts.activity.created"),
      detail: broadcast.reason,
      at: broadcast.createdAt,
      actor: broadcast.createdBy,
    },
    ...(broadcast.decidedAt
      ? [
          {
            id: "decided",
            title:
              broadcast.status === "rejected"
                ? t("broadcasts.activity.rejected")
                : t("broadcasts.activity.approved"),
            detail: broadcast.decisionComment,
            at: broadcast.decidedAt,
            actor: broadcast.decidedBy,
          },
        ]
      : []),
  ].reverse();

  return (
    <>
      <PageHeader
        title={broadcast.name}
        description={t("broadcasts.detail.subtitle", {
          segment: broadcast.segmentName,
        })}
        crumbs={[
          { label: t("nav.group.content") },
          { label: t("broadcasts.title"), to: "/content/broadcasts" },
          { label: broadcast.name },
        ]}
        meta={
          <>
            <BroadcastStatusBadge status={broadcast.status} />
            <ChannelLabel channel={broadcast.channel} />
          </>
        }
        actions={
          canDecide ? (
            <>
              <Button variant="outline" disabled={isOwn} onClick={() => setDialog("rejected")}>
                {t("broadcasts.reject")}
              </Button>
              <Button disabled={isOwn} onClick={() => setDialog("approved")}>
                {t("broadcasts.approve")}
              </Button>
            </>
          ) : null
        }
      />

      {canDecide && isOwn ? (
        <output className="mb-4 block rounded-md bg-warning-bg p-3 text-sm text-warning-text">
          {t("broadcasts.detail.selfBlocked")}
        </output>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("broadcasts.col.recipients")}
            value={formatCount(broadcast.recipientCount)}
          />
          <StatCard
            label={t("broadcasts.stat.delivered")}
            value={sent ? formatCount(broadcast.delivered) : "–"}
            tone="success"
          />
          <StatCard
            label={t("broadcasts.stat.failed")}
            value={sent ? formatCount(broadcast.failed) : "–"}
            tone={sent && broadcast.failed > 0 ? "danger" : "default"}
          />
          <StatCard
            label={t("broadcasts.stat.rate")}
            value={sent ? `${rate}%` : "–"}
            hint={sent ? undefined : t("broadcasts.stat.notSent")}
          />
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <SectionCard
              title={t("broadcasts.section.deliveryLog")}
              description={t("broadcasts.deliveryLog.hint")}
              flush
            >
              {sent ? (
                <SimpleTable<DeliveryRecord>
                  caption={t("broadcasts.section.deliveryLog")}
                  rows={broadcast.log}
                  getRowId={(r) => r.id}
                  columns={[
                    {
                      key: "recipient",
                      header: t("broadcasts.col.recipient"),
                      sortValue: (r) => r.recipient,
                      cell: (r) => <span className="tabular-nums">{r.recipient}</span>,
                    },
                    {
                      key: "status",
                      header: t("broadcasts.col.status"),
                      sortValue: (r) => r.status,
                      cell: (r) => <DeliveryStatusBadge status={r.status} />,
                    },
                    {
                      key: "reason",
                      header: t("broadcasts.col.reason"),
                      cell: (r) => r.reason ?? t("common.notAvailable"),
                    },
                  ]}
                />
              ) : (
                <p className="m-0 p-6 text-center text-sm text-muted-text">
                  {t("broadcasts.deliveryLog.empty")}
                </p>
              )}
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4">
            <MessagePreview
              channel={broadcast.channel}
              subject={broadcast.subject}
              body={broadcast.body}
            />
            <SectionCard title={t("broadcasts.section.summary")}>
              <KeyValueList
                columns={1}
                items={[
                  {
                    label: t("broadcasts.field.segment"),
                    value: broadcast.segmentName,
                  },
                  {
                    label: t("broadcasts.col.sends"),
                    value: broadcast.scheduledFor
                      ? formatLagos(broadcast.scheduledFor)
                      : t("broadcasts.timing.onApproval"),
                  },
                  { label: t("broadcasts.col.createdBy"), value: broadcast.createdBy },
                  { label: t("broadcasts.col.created"), value: formatLagos(broadcast.createdAt) },
                ]}
              />
            </SectionCard>
            <SectionCard title={t("broadcasts.section.activity")}>
              <Timeline entries={activity} />
            </SectionCard>
          </div>
        </div>
      </div>

      <ActionDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "approved" ? t("broadcasts.approve") : t("broadcasts.reject")}
        description={broadcast.name}
        impact={
          dialog === "approved"
            ? later && broadcast.scheduledFor
              ? t("broadcasts.approve.impactScheduled", {
                  count: formatCount(broadcast.recipientCount),
                  when: formatLagos(broadcast.scheduledFor),
                })
              : t("broadcasts.approve.impact", { count: formatCount(broadcast.recipientCount) })
            : t("broadcasts.reject.impact")
        }
        confirmLabel={dialog === "approved" ? t("broadcasts.approve") : t("broadcasts.reject")}
        destructive={dialog === "rejected"}
        onConfirm={async ({ reason }) => {
          await decideBroadcast({
            id: broadcast.id,
            decision: dialog === "approved" ? "approved" : "rejected",
            comment: reason,
          });
          await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
          return dialog === "approved" ? t("broadcasts.approve.done") : t("broadcasts.reject.done");
        }}
      />
    </>
  );
}
