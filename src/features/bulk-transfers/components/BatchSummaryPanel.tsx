import { Warning } from "@phosphor-icons/react";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { t } from "@/shared/i18n/t";
import { formatCount, formatLagos } from "@/shared/lib/format";
import { useBulkFee } from "../api/queries";
import { draftTotals, scheduledDate, type BatchDraft } from "../model/draft";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="text-muted-text">{label}</dt>
      <dd className="m-0 min-w-0 text-right text-ink">{value}</dd>
    </div>
  );
}

/** Live summary that stays beside the steps, so the totals are always in view. */
export function BatchSummaryPanel({ draft }: { draft: BatchDraft }) {
  const fee = useBulkFee(draft.payees);
  const totals = draftTotals(draft.payees, fee.feeKobo);
  const when = scheduledDate(draft);

  return (
    <SectionCard title={t("bulk.summary.title")}>
      <dl className="m-0 divide-y divide-border-soft">
        <Row
          label={t("bulk.field.name")}
          value={
            draft.name.trim() ? (
              <span className="break-words font-medium">{draft.name.trim()}</span>
            ) : (
              <span className="text-muted-text">{t("bulk.summary.unnamed")}</span>
            )
          }
        />
        <Row
          label={t("bulk.field.timing")}
          value={when ? formatLagos(when.toISOString()) : t("bulk.timing.onApproval")}
        />
      </dl>
      <dl className="m-0 mt-2 divide-y divide-border-soft border-t border-border-soft pt-2">
        <Row label={t("bulk.stat.payees")} value={formatCount(totals.count)} />
        <Row label={t("bulk.stat.total")} value={<MoneyText kobo={totals.totalKobo} />} />
        <Row
          label={t("bulk.stat.fees")}
          value={fee.known ? <MoneyText kobo={totals.feeKobo} /> : t("common.notAvailable")}
        />
      </dl>
      <div className="mt-3 rounded-md bg-surface-muted p-3">
        <p className="m-0 text-xs text-muted-text">{t("bulk.stat.debit")}</p>
        <p className="m-0 text-xl font-semibold tracking-tight text-ink">
          <MoneyText kobo={totals.debitKobo} />
        </p>
      </div>
      {totals.invalid > 0 ? (
        <output className="m-0 mt-3 flex items-center gap-1.5 text-xs text-danger-text">
          <Warning aria-hidden="true" size={14} weight="fill" />
          {t("bulk.summary.fix", { count: totals.invalid })}
        </output>
      ) : null}
    </SectionCard>
  );
}
