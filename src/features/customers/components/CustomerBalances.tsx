import { MoneyText } from "@/shared/components/MoneyText";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import type { Customer } from "../model/types";

/** The customer's money at a glance, shown above the tabs so it stays in view on every tab. */
export function CustomerBalances({ customer }: { customer: Customer }) {
  const figures = [
    { label: t("customers.summary.balance"), kobo: customer.balanceKobo, lead: true },
    { label: t("customers.summary.ledger"), kobo: customer.ledgerBalanceKobo },
    { label: t("customers.summary.moneyIn"), kobo: customer.moneyInKobo },
    { label: t("customers.summary.moneyOut"), kobo: customer.moneyOutKobo },
  ];

  return (
    <section aria-label={t("customers.summary.money")} className="card mb-5 overflow-hidden">
      {/* The 1px gaps over a border-coloured background draw the dividers between the cells. */}
      <dl className="m-0 grid grid-cols-2 gap-px bg-border-soft md:grid-cols-4">
        {figures.map(({ label, kobo, lead }) => (
          <div key={label} className="min-w-0 bg-card px-4 py-3 sm:px-5 sm:py-4">
            <dt className="text-xs text-muted-text">{label}</dt>
            <dd
              className={cn(
                "m-0 mt-1 font-heading font-semibold tracking-tight break-words tabular-nums",
                lead ? "text-xl text-ink sm:text-2xl" : "text-lg text-ink sm:text-xl",
              )}
            >
              <MoneyText kobo={kobo} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
