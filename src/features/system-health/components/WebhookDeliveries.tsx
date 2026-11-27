import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { FilterBar } from "@/shared/components/FilterBar";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatCard } from "@/shared/components/StatCard";
import { Button } from "@/shared/components/ui/Button";
import { NativeSelect } from "@/shared/components/ui/NativeSelect";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCount, NO_VALUE } from "@/shared/lib/format";
import {
  listDeliveries,
  resendDelivery,
  type Delivery,
  type DeliveryChannel,
  type DeliveryStatus,
} from "../api/systemApi";
import { DeliveryPayload } from "./DeliveryPayload";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";

// Only these can be sent again; the others are delivered or still being worked on.
const RESENDABLE: DeliveryStatus[] = ["dead", "stuck"];
const DEFAULTS = { status: "all", channel: "all", search: "", page: "1", limit: "10" };
const STATUSES: DeliveryStatus[] = [
  "dead",
  "stuck",
  "failed",
  "published",
  "pending",
  "publishing",
  "delivered",
];
const CHANNELS: DeliveryChannel[] = ["funding_webhook", "merchant_progress"];

export function WebhookDeliveries() {
  const queryClient = useQueryClient();
  const can = useCan();
  const [filters, setFilter, { setFilters }] = useUrlFilters(DEFAULTS);
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Number(filters.limit) || 10;
  const query = {
    status: filters.status === "all" ? undefined : (filters.status as DeliveryStatus),
    channel: filters.channel === "all" ? undefined : (filters.channel as DeliveryChannel),
    search: filters.search || undefined,
    page,
    limit,
  };
  const deliveries = useApiQuery(["system", "deliveries", query], () => listDeliveries(query), {
    keepPreviousPage: true,
  });
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [resending, setResending] = useState<Delivery | null>(null);
  const counts = deliveries.data?.counts;
  const count = (...statuses: DeliveryStatus[]) =>
    counts ? formatCount(statuses.reduce((sum, status) => sum + counts[status], 0)) : NO_VALUE;
  const dirty =
    filters.status !== DEFAULTS.status || filters.channel !== "all" || filters.search !== "";
  const clear = () => setFilters({ status: DEFAULTS.status, channel: "all", search: "" });

  return (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("jobs.delivery.status.dead")}
          value={count("dead")}
          tone={counts && counts.dead > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("jobs.delivery.status.stuck")}
          value={count("stuck")}
          tone={counts && counts.stuck > 0 ? "warning" : "default"}
        />
        <StatCard label={t("jobs.delivery.status.failed")} value={count("failed")} />
        <StatCard
          label={t("jobs.delivery.stat.inProgress")}
          value={count("pending", "publishing", "published")}
        />
        <StatCard label={t("jobs.delivery.status.delivered")} value={count("delivered")} />
      </div>

      <FilterBar
        search={{
          value: filters.search,
          onChange: (value) => setFilter("search", value),
          placeholder: t("jobs.delivery.search"),
          label: t("jobs.delivery.search"),
        }}
        onClear={clear}
        dirty={dirty}
      >
        <NativeSelect
          aria-label={t("jobs.col.status")}
          className="w-48"
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="all">{t("jobs.delivery.allStatuses")}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`jobs.delivery.status.${status}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("jobs.delivery.col.channel")}
          className="w-48"
          value={filters.channel}
          onChange={(event) => setFilter("channel", event.target.value)}
        >
          <option value="all">{t("jobs.delivery.allChannels")}</option>
          {CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {t(`jobs.delivery.channel.${channel}`)}
            </option>
          ))}
        </NativeSelect>
      </FilterBar>

      <SectionCard flush>
        <AsyncBody
          query={deliveries}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("jobs.delivery.empty")}
          emptyDescription={t("jobs.delivery.empty.description")}
          filtered={dirty}
          onClearFilters={clear}
        >
          {(data) => (
            <DataTable<Delivery>
              storageKey="system-deliveries"
              caption={t("jobs.tab.deliveries")}
              rows={data.rows}
              page={page}
              limit={limit}
              total={data.total}
              onPageChange={(next) => setFilters({ page: String(next) })}
              onLimitChange={(next) => setFilters({ limit: String(next) })}
              getRowId={(row) => row.id}
              onRowOpen={setSelected}
              columns={[
                {
                  key: "reference",
                  header: t("jobs.delivery.col.reference"),
                  cell: (row) => row.reference ?? NO_VALUE,
                },
                {
                  key: "event",
                  header: t("jobs.delivery.col.event"),
                  cell: (row) => row.destination,
                },
                {
                  key: "channel",
                  header: t("jobs.delivery.col.channel"),
                  cell: (row) => t(`jobs.delivery.channel.${row.channel}`),
                },
                {
                  key: "status",
                  header: t("jobs.col.status"),
                  cell: (row) => <DeliveryStatusBadge status={row.status} />,
                },
                {
                  key: "attempts",
                  header: t("jobs.delivery.col.attempts"),
                  align: "right",
                  cell: (row) => formatCount(row.attempts),
                },
                {
                  key: "updated",
                  header: t("jobs.delivery.col.updated"),
                  cell: (row) => <DateText iso={row.updatedAt} />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <DetailsSheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        size="md"
        title={t("jobs.delivery.details")}
        description={selected?.reference ?? undefined}
        action={
          selected && RESENDABLE.includes(selected.status) && can("queues:manage") ? (
            <Button onClick={() => setResending(selected)}>{t("jobs.delivery.resend")}</Button>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <DeliveryStatusBadge status={selected.status} />
            {selected.status === "stuck" ? (
              <p className="m-0 text-sm text-muted-text">{t("jobs.delivery.stuck.note")}</p>
            ) : null}
            <KeyValueList
              columns={1}
              items={[
                { label: t("jobs.delivery.col.event"), value: selected.destination },
                {
                  label: t("jobs.delivery.col.channel"),
                  value: t(`jobs.delivery.channel.${selected.channel}`),
                },
                { label: t("jobs.delivery.col.attempts"), value: formatCount(selected.attempts) },
                {
                  label: t("jobs.delivery.created"),
                  value: <DateText iso={selected.createdAt} />,
                },
                {
                  label: t("jobs.delivery.col.updated"),
                  value: <DateText iso={selected.updatedAt} />,
                },
                ...(selected.deliveredAt
                  ? [
                      {
                        label: t("jobs.delivery.deliveredAt"),
                        value: <DateText iso={selected.deliveredAt} />,
                      },
                    ]
                  : []),
                {
                  label: t("jobs.col.error"),
                  value: selected.lastError ? (
                    <span className="break-words">{selected.lastError}</span>
                  ) : (
                    NO_VALUE
                  ),
                },
              ]}
            />
            {/* Keyed, so one delivery's payload is never shown under another. */}
            <DeliveryPayload key={selected.id} deliveryId={selected.id} />
          </div>
        ) : null}
      </DetailsSheet>

      <ActionDialog
        open={resending !== null}
        onOpenChange={(open) => !open && setResending(null)}
        title={t("jobs.delivery.resend")}
        description={resending?.reference ?? resending?.destination}
        impact={t(
          resending?.status === "stuck"
            ? "jobs.delivery.resend.impact.stuck"
            : "jobs.delivery.resend.impact",
        )}
        confirmLabel={t("jobs.delivery.resend")}
        onConfirm={async ({ reason }) => {
          if (resending) await resendDelivery(resending.id, reason);
          await queryClient.invalidateQueries();
          setSelected(null);
          return t("jobs.delivery.resend.done");
        }}
      />
    </>
  );
}
