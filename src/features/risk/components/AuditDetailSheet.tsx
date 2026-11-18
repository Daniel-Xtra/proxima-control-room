import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { NO_VALUE } from "@/shared/lib/format";
import { t } from "@/shared/i18n/t";
import type { AuditEntry } from "../api/riskApi";

function Json({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="m-0 text-xs font-medium text-muted-text">{label}</h3>
      {value ? (
        <pre className="m-0 max-h-72 overflow-auto rounded-md border border-border bg-surface-muted p-3 text-xs text-ink">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="m-0 text-sm text-muted-text">{t("audit.detail.none")}</p>
      )}
    </section>
  );
}

/** Everything recorded about one audit event. */
export function AuditDetailSheet({
  entry,
  onClose,
}: {
  entry: AuditEntry | null;
  onClose: () => void;
}) {
  return (
    <DetailsSheet
      open={entry !== null}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={entry?.action ?? ""}
      description={t("audit.detail.title")}
    >
      {entry ? (
        <div className="flex flex-col gap-5">
          <StatusBadge
            tone={entry.status === "success" ? "success" : "danger"}
            label={t(`audit.status.${entry.status}`)}
          />
          <KeyValueList
            columns={1}
            items={[
              { label: t("audit.col.time"), value: <DateText iso={entry.at} /> },
              { label: t("audit.col.actor"), value: entry.actor || NO_VALUE },
              { label: t("audit.detail.role"), value: entry.actorRole || NO_VALUE },
              { label: t("audit.detail.actorId"), value: entry.actorId || NO_VALUE },
              { label: t("audit.detail.targetType"), value: entry.targetType || NO_VALUE },
              { label: t("audit.detail.targetId"), value: entry.targetId || NO_VALUE },
              { label: t("audit.ip"), value: entry.ip || NO_VALUE },
              { label: t("audit.detail.reason"), value: entry.reason || NO_VALUE },
              { label: t("audit.detail.id"), value: <span className="tabular">{entry.id}</span> },
            ]}
          />
          <Json label={t("audit.detail.before")} value={entry.beforeData} />
          <Json label={t("audit.detail.after")} value={entry.afterData} />
        </div>
      ) : null}
    </DetailsSheet>
  );
}
