import { Info, Warning } from "@phosphor-icons/react";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { t } from "@/shared/i18n/t";
import { formatCount, formatKobo, formatLagos } from "@/shared/lib/format";
import { draftTotals, scheduledDate, type BatchDraft } from "../model/draft";
import { LARGE_BATCH_KOBO, type BalanceInfo, type PayeeDraft } from "../model/types";

const PREVIEW_ROWS = 8;

export function ReviewStep({ draft, balance }: { draft: BatchDraft; balance: BalanceInfo }) {
  const totals = draftTotals(draft.payees);
  const shortKobo =
    balance.status === "success" && balance.kobo !== undefined
      ? totals.debitKobo - balance.kobo
      : 0;
  const when = scheduledDate(draft);
  const preview = draft.payees.slice(0, PREVIEW_ROWS);
  const hidden = draft.payees.length - preview.length;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("bulk.review.title")} description={t("bulk.review.description")}>
        <KeyValueList
          items={[
            { label: t("bulk.field.name"), value: draft.name.trim() },
            { label: t("bulk.field.source"), value: draft.source },
            {
              label: t("bulk.field.timing"),
              value: when ? formatLagos(when.toISOString()) : t("bulk.timing.onApproval"),
            },
            { label: t("bulk.stat.payees"), value: formatCount(totals.count) },
            { label: t("bulk.stat.total"), value: <MoneyText kobo={totals.totalKobo} /> },
            { label: t("bulk.stat.fees"), value: <MoneyText kobo={totals.feeKobo} /> },
          ]}
        />
      </SectionCard>

      <SectionCard title={t("bulk.section.payees")} flush>
        <SimpleTable<PayeeDraft>
          caption={t("bulk.section.payees")}
          rows={preview}
          getRowId={(d) => String(d.row)}
          columns={[
            { key: "name", header: t("bulk.col.accountName"), cell: (d) => d.accountName },
            {
              key: "account",
              header: t("bulk.col.accountNumber"),
              cell: (d) => <span className="tabular-nums">{d.accountNumber}</span>,
            },
            { key: "bank", header: t("bulk.col.bank"), cell: (d) => d.bank },
            {
              key: "amount",
              header: t("bulk.col.amount"),
              align: "right",
              cell: (d) => <MoneyText kobo={d.amountKobo ?? 0} />,
            },
          ]}
        />
        {hidden > 0 ? (
          <p className="m-0 border-t border-border-soft px-4 py-3 text-xs text-muted-text">
            {t("bulk.review.more", { count: hidden })}
          </p>
        ) : null}
      </SectionCard>

      {shortKobo > 0 ? (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-danger bg-danger-bg p-3 text-sm text-danger-text"
        >
          <Warning aria-hidden="true" size={16} weight="fill" className="mt-0.5 shrink-0" />
          <p className="m-0">{t("bulk.balance.insufficient", { short: formatKobo(shortKobo) })}</p>
        </div>
      ) : null}

      <div className="flex gap-2 rounded-md border border-border-soft bg-info-bg p-3 text-sm text-info-text">
        <Info aria-hidden="true" size={16} weight="fill" className="mt-0.5 shrink-0" />
        <div>
          <p className="m-0">{t("bulk.review.note")}</p>
          {totals.debitKobo > LARGE_BATCH_KOBO ? (
            <p className="m-0 mt-1">{t("bulk.review.large")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
