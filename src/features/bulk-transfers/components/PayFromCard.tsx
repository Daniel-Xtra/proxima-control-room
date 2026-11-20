import { Warning } from "@phosphor-icons/react";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { t } from "@/shared/i18n/t";
import { formatKobo } from "@/shared/lib/format";
import { useSourceBalances } from "../api/queries";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="text-muted-text">{label}</dt>
      <dd className="m-0 min-w-0 text-right text-ink">{value}</dd>
    </div>
  );
}

/**
 * The account a batch is paid from, what it holds now and what is left after the payout. Only the person who chooses the
 * account and the one who approves the payout see this; the person who uploaded the batch never does.
 */
export function PayFromCard({
  sourceId,
  debitKobo,
}: {
  sourceId: string | null;
  debitKobo: number;
}) {
  const balances = useSourceBalances();
  const source = balances.data?.find((item) => item.id === sourceId);
  const available = source?.balanceKobo ?? null;
  const after = available === null ? null : available - debitKobo;

  return (
    <SectionCard title={t("bulk.pay.title")}>
      <dl className="m-0 divide-y divide-border-soft">
        <Row
          label={t("bulk.field.source")}
          value={source?.name ?? sourceId ?? t("common.notAvailable")}
        />
        <Row
          label={t("bulk.balance.available")}
          value={
            balances.status === "pending" ? (
              <Skeleton className="ml-auto inline-block h-4 w-24 align-middle" />
            ) : available === null ? (
              <span className="text-danger-text">{t("bulk.balance.unavailable")}</span>
            ) : (
              <MoneyText kobo={available} className="font-semibold" />
            )
          }
        />
        <Row label={t("bulk.stat.debit")} value={<MoneyText kobo={debitKobo} />} />
        <Row
          label={t("bulk.balance.after")}
          value={
            after === null ? (
              t("common.notAvailable")
            ) : (
              <MoneyText
                kobo={after}
                className={after < 0 ? "font-semibold text-danger-text" : "font-semibold"}
              />
            )
          }
        />
      </dl>
      {after !== null && after < 0 ? (
        <div
          role="alert"
          className="mt-3 flex gap-2 rounded-md border border-danger bg-danger-bg p-3 text-sm text-danger-text"
        >
          <Warning aria-hidden="true" size={16} weight="fill" className="mt-0.5 shrink-0" />
          <p className="m-0">{t("bulk.balance.insufficient", { short: formatKobo(-after) })}</p>
        </div>
      ) : null}
    </SectionCard>
  );
}
