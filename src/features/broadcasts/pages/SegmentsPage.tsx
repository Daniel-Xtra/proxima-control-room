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
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { broadcastKeys, useSegments } from "../api/queries";
import { deleteSegment } from "../api/segmentsApi";
import { SegmentEditorDialog } from "../components/SegmentEditorDialog";
import { describeRules } from "../model/audience";
import type { AudienceSegment } from "../model/types";

const DEFAULTS = { q: "" };

export function SegmentsPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const canEdit = can("content:edit");
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const result = useSegments({ search: filters.q });
  const [editing, setEditing] = useState<AudienceSegment | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<AudienceSegment | null>(null);

  function openEditor(segment: AudienceSegment | null) {
    setEditing(segment);
    setEditorOpen(true);
  }

  return (
    <>
      <PageHeader
        title={t("segments.title")}
        description={t("segments.description")}
        crumbs={[{ label: t("nav.group.content") }, { label: t("segments.title") }]}
        actions={
          <Can permission="content:edit">
            <Button onClick={() => openEditor(null)}>
              <Plus aria-hidden="true" />
              {t("segments.new")}
            </Button>
          </Can>
        }
      />
      <FilterBar
        onClear={() => setFilter("q", "")}
        dirty={filters.q !== ""}
        search={{
          value: filters.q,
          onChange: (value) => setFilter("q", value),
          placeholder: t("segments.search"),
          label: t("segments.searchLabel"),
        }}
      />

      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("segments.empty.title")}
          emptyDescription={t("segments.empty.description")}
        >
          {(rows) => (
            <SimpleTable<AudienceSegment>
              caption={t("segments.title")}
              rows={rows}
              getRowId={(r) => r.id}
              onRowOpen={canEdit ? (r) => !r.builtIn && openEditor(r) : undefined}
              columns={[
                {
                  key: "name",
                  header: t("segments.col.name"),
                  sortValue: (r) => r.name,
                  cell: (r) => (
                    <div className="max-w-xs whitespace-normal">
                      <p className="m-0 font-medium text-ink">
                        {r.name}
                        {r.builtIn ? (
                          <span className="ml-2 text-xs font-normal text-muted-text">
                            {t("segments.builtIn")}
                          </span>
                        ) : null}
                      </p>
                      {r.description ? (
                        <p className="m-0 text-xs text-muted-text">{r.description}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "rules",
                  header: t("segments.col.rules"),
                  cell: (r) => describeRules(r.rules),
                },
                {
                  key: "size",
                  header: t("segments.col.size"),
                  align: "right",
                  sortValue: (r) => r.size,
                  cell: (r) => formatCount(r.size),
                },
                {
                  key: "used",
                  header: t("segments.col.used"),
                  align: "right",
                  sortValue: (r) => r.broadcastCount,
                  cell: (r) => r.broadcastCount,
                },
                {
                  key: "by",
                  header: t("segments.col.updatedBy"),
                  sortValue: (r) => r.updatedBy,
                  cell: (r) => r.updatedBy,
                },
                {
                  key: "at",
                  header: t("segments.col.updated"),
                  sortValue: (r) => r.updatedAt,
                  cell: (r) => <DateText iso={r.updatedAt} dateOnly />,
                },
                {
                  key: "delete",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    canEdit && !r.builtIn ? (
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        aria-label={t("segments.deleteNamed", { name: r.name })}
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

      <SegmentEditorDialog
        key={`${editing?.id ?? "new"}-${editorOpen}`}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        segment={editing}
      />

      <ActionDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("segments.delete")}
        description={deleting?.name}
        impact={t("segments.delete.impact")}
        confirmLabel={t("segments.delete")}
        destructive
        typedConfirmation
        requireTotp={false}
        requireReason={false}
        onConfirm={async () => {
          if (deleting) await deleteSegment(deleting.id, "");
          await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
          return t("segments.deleted");
        }}
      />
    </>
  );
}
