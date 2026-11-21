import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import type { BulkBatch } from "../model/types";

/** The money in the batch and how far the payouts have got, in one card at the top of the page. */
export function BatchOverview({ batch }: { batch: BulkBatch }) {
  const { counts, itemCount } = batch;
  const done = counts.success + counts.failed;
  const share = (n: number) => (itemCount > 0 ? (n / itemCount) * 100 : 0);
  const debitKobo = batch.totalKobo + batch.feeKobo;

  const legend = [
    { id: "success", count: counts.success, dot: "bg-success-solid" },
    { id: "failed", count: counts.failed, dot: "bg-danger" },
    { id: "processing", count: counts.processing + counts.unknown, dot: "bg-info-text" },
    { id: "pending", count: counts.pending, dot: "bg-border-strong" },
  ] as const;

  return (
    <SectionCard>
      <dl className="m-0 grid gap-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-text">{t("bulk.stat.total")}</dt>
          <dd className="m-0 mt-1 text-2xl font-semibold text-ink">
            <MoneyText kobo={batch.totalKobo} />
          </dd>
          <dd className="m-0 mt-1 text-xs text-muted-text">
            {t("bulk.overview.toPayees", { count: formatCount(itemCount) })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-text">{t("bulk.stat.fees")}</dt>
          <dd className="m-0 mt-1 text-2xl font-semibold text-ink">
            <MoneyText kobo={batch.feeKobo} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-text">{t("bulk.stat.debit")}</dt>
          <dd className="m-0 mt-1 text-2xl font-semibold text-ink">
            <MoneyText kobo={debitKobo} />
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border-soft pt-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold text-ink">{t("bulk.overview.progress")}</h3>
          <p className="m-0 text-xs text-muted-text">
            {t("bulk.overview.processed", {
              done: formatCount(done),
              count: formatCount(itemCount),
            })}
          </p>
        </div>
        <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-neutral-bg">
          <div className="bar-reveal flex h-full w-full">
            <span
              className="bg-success-solid transition-[width] duration-1000"
              style={{ width: `${share(counts.success)}%` }}
            />
            <span
              className="bg-danger transition-[width] duration-1000"
              style={{ width: `${share(counts.failed)}%` }}
            />
            <span
              className="bar-moving bg-info-text transition-[width] duration-1000"
              style={{ width: `${share(counts.processing + counts.unknown)}%` }}
            />
          </div>
        </div>
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-muted-text">
          {legend.map((entry) => (
            <li key={entry.id} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2 rounded-full ${entry.dot}`} />
              {t(`bulk.legend.${entry.id}`)}
              <span className="tabular font-medium text-ink">{formatCount(entry.count)}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
