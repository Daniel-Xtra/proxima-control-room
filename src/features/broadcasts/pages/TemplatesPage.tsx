import { Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can, useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
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
import { deleteTemplate } from "../api/broadcastsApi";
import { broadcastKeys, useTemplates } from "../api/queries";
import { ChannelLabel } from "../components/BroadcastBadges";
import { TemplateEditorDialog } from "../components/TemplateEditorDialog";
import { fillSample } from "../model/message";
import { CHANNELS, type BroadcastTemplate } from "../model/types";

const DEFAULTS = { q: "", channel: "all" };

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const canEdit = can("content:edit");
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useTemplates({ search: filters.q, channel: filters.channel });
  const [editing, setEditing] = useState<BroadcastTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<BroadcastTemplate | null>(null);

  function openEditor(template: BroadcastTemplate | null) {
    setEditing(template);
    setEditorOpen(true);
  }

  return (
    <>
      <PageHeader
        title={t("templates.title")}
        description={t("templates.description")}
        crumbs={[
          { label: t("nav.group.content") },
          { label: t("broadcasts.title"), to: "/content/broadcasts" },
          { label: t("templates.title") },
        ]}
        actions={
          <Can permission="content:edit">
            <Button onClick={() => openEditor(null)}>
              <Plus aria-hidden="true" />
              {t("templates.new")}
            </Button>
          </Can>
        }
      />
      <FilterBar
        onClear={() => (["q", "channel"] as const).forEach((key) => setFilter(key, DEFAULTS[key]))}
        dirty={filters.q !== "" || filters.channel !== "all"}
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("templates.search"),
          label: t("templates.searchLabel"),
        }}
      >
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
          emptyTitle={t("templates.empty.title")}
          emptyDescription={t("templates.empty.description")}
        >
          {(rows) => (
            <SimpleTable<BroadcastTemplate>
              storageKey="templates"
              caption={t("templates.title")}
              rows={rows}
              getRowId={(r) => r.id}
              onRowOpen={canEdit ? openEditor : undefined}
              columns={[
                {
                  key: "name",
                  header: t("templates.col.name"),
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
                  key: "message",
                  header: t("templates.col.message"),
                  cell: (r) => (
                    <div className="max-w-md whitespace-normal">
                      {r.subject ? <p className="m-0 font-medium text-ink">{r.subject}</p> : null}
                      <p className="m-0 line-clamp-2 text-xs text-muted-text">
                        {fillSample(r.body)}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "at",
                  header: t("templates.col.updated"),
                  sortValue: (r) => r.updatedAt,
                  cell: (r) => <DateText iso={r.updatedAt} dateOnly />,
                },
                {
                  key: "delete",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    canEdit ? (
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        aria-label={t("templates.deleteNamed", { name: r.name })}
                        onClick={() => setDeleting(r)}
                      >
                        <Trash aria-hidden="true" />
                      </Button>
                    ) : null,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <TemplateEditorDialog
        key={`${editing?.id ?? "new"}-${editorOpen}`}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
      />

      <ActionDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("templates.delete")}
        description={deleting?.name}
        impact={t("templates.delete.impact")}
        confirmLabel={t("templates.delete")}
        destructive
        typedConfirmation
        requireTotp={false}
        requireReason={false}
        onConfirm={async () => {
          if (deleting) await deleteTemplate(deleting.id, "");
          await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
          return t("templates.deleted");
        }}
      />
    </>
  );
}
