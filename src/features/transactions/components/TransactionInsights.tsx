import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { MoneyText } from "@/shared/components/MoneyText";
import { Input } from "@/shared/components/ui/Input";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { lagosDay } from "@/shared/lib/dateRange";
import { NO_VALUE } from "@/shared/lib/format";
import { useTransactionSummary } from "../api/queries";

/** Money in, money out and their total for the days you pick (today by default). Independent of the table's filters. */
export function TransactionInsights() {
  const today = lagosDay();
  const [days, setDays] = useState({ from: today, to: today });
  const summary = useTransactionSummary(days.from, days.to);
  const data = summary.data;

  return (
    <section className="card mb-4 p-4" aria-label={t("transactions.insights.title")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-text">{t("transactions.insights.title")}</span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2">
          <Input
            type="date"
            aria-label={t("range.from")}
            className="h-10 w-36 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            value={days.from}
            max={days.to}
            onChange={(event) =>
              event.target.value && setDays({ ...days, from: event.target.value })
            }
          />
          <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-text" />
          <Input
            type="date"
            aria-label={t("range.to")}
            className="h-10 w-36 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            value={days.to}
            min={days.from}
            max={today}
            onChange={(event) => event.target.value && setDays({ ...days, to: event.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard label={t("transactions.insights.total")} kobo={data?.totalKobo} />
        <InsightCard
          label={t("transactions.insights.credits")}
          kobo={data?.creditsKobo}
          tone="credit"
        />
        <InsightCard
          label={t("transactions.insights.debits")}
          kobo={data?.debitsKobo}
          tone="debit"
        />
      </div>
    </section>
  );
}

function InsightCard({
  label,
  kobo,
  tone,
}: {
  label: string;
  kobo: number | undefined;
  tone?: "credit" | "debit";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-5 py-4",
        tone === "credit"
          ? "border-success-border bg-success-soft"
          : tone === "debit"
            ? "border-danger-border bg-danger-soft"
            : "border-border bg-card",
      )}
    >
      <p className="m-0 text-sm text-muted-text">{label}</p>
      <p className="m-0 mt-2 font-heading text-2xl font-semibold text-ink">
        {kobo === undefined ? NO_VALUE : <MoneyText kobo={kobo} />}
      </p>
    </div>
  );
}
