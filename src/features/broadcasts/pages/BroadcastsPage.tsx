import { Plus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Can } from "@/features/auth";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { useBroadcasts } from "../api/queries";
import { BroadcastStatusBadge, ChannelLabel } from "../components/BroadcastBadges";
import { CHANNELS, type BroadcastRow } from "../model/types";

const DEFAULTS = { q: "", status: "all", channel: "all" };

export function BroadcastsPage() {
  const navigate = useNavigate();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useBroadcasts({
    search: filters.q,
    status: filters.status,
    channel: filters.channel,
  });

  return (
    <>
      <PageHeader
        title={t("broadcasts.title")}
        description={t("broadcasts.description")}
        crumbs={[{ label: t("nav.group.content") }, { label: t("broadcasts.title") }]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/content/broadcast-templates")}>
              {t("templates.title")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/content/audience-segments")}>
              {t("segments.title")}
            </Button>
            <Can permission="content:edit">
              <Button onClick={() => navigate("/content/broadcasts/new")}>
                <Plus aria-hidden="true" />
                {t("broadcasts.new")}
              </Button>
            </Can>
          </>
        }
      />
      <FilterBar
        onClear={() =>
          (["q", "status", "channel"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))
        }
        dirty={filters.q !== "" || filters.status !== "all" || filters.channel !== "all"}
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("broadcasts.search"),
          label: t("broadcasts.searchLabel"),
        }}
      >
        <div className="w-48">
          <Select value={filters.status} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger aria-label={t("broadcasts.filter.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("broadcasts.filter.anyStatus")}</SelectItem>
              <SelectItem value="pending_approval">
                {t("broadcasts.status.pending_approval")}
              </SelectItem>
              <SelectItem value="scheduled">{t("broadcasts.status.scheduled")}</SelectItem>
              <SelectItem value="sent">{t("broadcasts.status.sent")}</SelectItem>
              <SelectItem value="rejected">{t("broadcasts.status.rejected")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={filters.channel} onValueChange={(v) => setFilter("channel", v)}>
            <SelectTrigger aria-label={t("broadcasts.filter.channel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("broadcasts.filter.anyChannel")}</SelectItem>
              {CHANNELS.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {t(`broadcasts.channel.${channel}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("broadcasts.empty.title")}
          emptyDescription={t("broadcasts.empty.description")}
        >
          {(rows) => (
            <SimpleTable<BroadcastRow>
              caption={t("broadcasts.title")}
              rows={rows}
              getRowId={(r) => r.id}
              onRowOpen={(row) => navigate(`/content/broadcasts/${row.id}`)}
              columns={[
                {
                  key: "name",
                  header: t("broadcasts.col.name"),
                  sortValue: (r) => r.name,
                  cell: (r) => r.name,
                },
                {
                  key: "channel",
                  header: t("broadcasts.col.channel"),
                  sortValue: (r) => r.channel,
                  cell: (r) => <ChannelLabel channel={r.channel} />,
                },
                {
                  key: "audience",
                  header: t("broadcasts.col.audience"),
                  sortValue: (r) => r.segmentName,
                  cell: (r) => r.segmentName,
                },
                {
                  key: "recipients",
                  header: t("broadcasts.col.recipients"),
                  align: "right",
                  sortValue: (r) => r.recipientCount,
                  cell: (r) => formatCount(r.recipientCount),
                },
                {
                  key: "status",
                  header: t("broadcasts.col.status"),
                  sortValue: (r) => r.status,
                  cell: (r) => <BroadcastStatusBadge status={r.status} />,
                },
                {
                  key: "sends",
                  header: t("broadcasts.col.sends"),
                  sortValue: (r) => r.scheduledFor ?? "",
                  cell: (r) =>
                    r.scheduledFor ? (
                      <DateText iso={r.scheduledFor} />
                    ) : (
                      t("broadcasts.timing.onApproval")
                    ),
                },
                {
                  key: "by",
                  header: t("broadcasts.col.createdBy"),
                  sortValue: (r) => r.createdBy,
                  cell: (r) => r.createdBy,
                },
                {
                  key: "at",
                  header: t("broadcasts.col.created"),
                  sortValue: (r) => r.createdAt,
                  cell: (r) => <DateText iso={r.createdAt} />,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
    </>
  );
}
