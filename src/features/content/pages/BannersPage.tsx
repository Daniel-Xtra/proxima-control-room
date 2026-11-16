import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can, useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Switch } from "@/shared/components/ui/Switch";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { deleteBanner, listBanners, toggleBanner } from "../api/bannersApi";
import { BannerFormDialog } from "../components/BannerFormDialog";
import type { Banner } from "../model/types";

export function BannersPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const query = useApiQuery(["banners"], listBanners);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toggling, setToggling] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const canEdit = can("content:edit");
  const canPublish = can("content:publish");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["banners"] });

  return (
    <>
      <PageHeader
        title={t("banners.title")}
        crumbs={[{ label: t("nav.group.content") }, { label: t("banners.title") }]}
        description={t("banners.description")}
        actions={
          <Can permission="content:edit">
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              {t("banners.create")}
            </Button>
          </Can>
        }
      />
      <SectionCard flush>
        <AsyncBody
          query={query}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("banners.empty")}
        >
          {(rows) => (
            <SimpleTable<Banner>
              caption={t("banners.title")}
              rows={rows}
              getRowId={(r) => r.id}
              columns={[
                { key: "priority", header: t("banners.field.priority"), cell: (r) => r.priority },
                {
                  key: "title",
                  header: t("banners.field.title"),
                  sortValue: (r: { title: string }) => r.title,
                  cell: (r) => (
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-text">{r.description}</p>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: t("banners.field.type"),
                  cell: (r) => <StatusBadge tone="info" label={t(`banners.type.${r.type}`)} />,
                },
                {
                  key: "display",
                  header: t("banners.field.display"),
                  cell: (r) => t(`banners.display.${r.displayType}`),
                },
                {
                  key: "views",
                  header: t("banners.col.impressions"),
                  sortValue: (r: { impressions: number }) => r.impressions,
                  align: "right",
                  cell: (r) => formatCount(r.impressions),
                },
                {
                  key: "ctr",
                  header: t("banners.col.ctr"),
                  align: "right",
                  cell: (r) =>
                    r.impressions
                      ? `${((r.clicks / r.impressions) * 100).toFixed(1)}%`
                      : t("common.notAvailable"),
                },
                {
                  key: "active",
                  header: t("banners.field.active"),
                  cell: (r) => (
                    <Switch
                      checked={r.active}
                      disabled={!canPublish}
                      aria-label={t("banners.toggle", { title: r.title })}
                      onCheckedChange={() => setToggling(r)}
                    />
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    canEdit ? (
                      <span className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("banners.editNamed", { title: r.title })}
                          onClick={() => {
                            setEditing(r);
                            setFormOpen(true);
                          }}
                        >
                          <PencilSimple aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          aria-label={t("banners.deleteNamed", { title: r.title })}
                          onClick={() => setDeleting(r)}
                        >
                          <Trash aria-hidden="true" />
                        </Button>
                      </span>
                    ) : null,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <BannerFormDialog
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editing}
      />

      <ActionDialog
        open={toggling !== null}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.active ? t("banners.deactivate") : t("banners.activate")}
        description={toggling?.title}
        impact={toggling?.active ? t("banners.deactivateImpact") : t("banners.activateImpact")}
        confirmLabel={toggling?.active ? t("banners.deactivate") : t("banners.activate")}
        requireTotp={false}
        requireReason={false}
        onConfirm={async ({ reason }) => {
          if (toggling) await toggleBanner(toggling.id, reason);
          await refresh();
          return t("banners.saved");
        }}
      />
      <ActionDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("banners.delete")}
        description={deleting?.title}
        impact={t("banners.deleteImpact")}
        confirmLabel={t("banners.delete")}
        typedConfirmation
        destructive
        onConfirm={async ({ reason }) => {
          if (deleting) await deleteBanner(deleting.id, reason);
          await refresh();
          return t("banners.deleted");
        }}
      />
    </>
  );
}
