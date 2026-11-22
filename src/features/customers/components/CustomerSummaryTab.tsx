import { useCan } from "@/features/auth";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { DateText } from "@/shared/components/DateText";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { NO_VALUE } from "@/shared/lib/format";
import { t } from "@/shared/i18n/t";
import type { Customer } from "../model/types";
import { RevealableField } from "./RevealableField";

export function CustomerSummaryTab({ customer }: { customer: Customer }) {
  const can = useCan();
  const reveal = can("customer:view_sensitive");
  // A customer with no daily limit on record has nothing to measure usage against.
  const usedPercent =
    customer.dailyLimitKobo > 0
      ? Math.min(100, Math.round((customer.dailyUsedKobo / customer.dailyLimitKobo) * 100))
      : 0;
  const checks: [string, boolean][] = [
    [t("customers.verify.phone"), customer.phoneVerified],
    [t("customers.verify.email"), customer.emailVerified],
    [t("customers.verify.kyc"), customer.kycCompleted],
    [t("customers.verify.pin"), customer.pinSet],
    [t("customers.verify.address"), customer.addressSet],
    [t("customers.verify.docs"), customer.complianceDocsSet],
  ];
  const done = checks.filter(([, ok]) => ok).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SectionCard title={t("customers.summary.identity")} className="min-w-0 lg:col-span-2">
        <KeyValueList
          items={[
            {
              label: t("customers.summary.accountNumber"),
              value: customer.reservedAccount ? (
                <span className="tabular">{customer.reservedAccount}</span>
              ) : (
                NO_VALUE
              ),
            },
            { label: t("customers.summary.bank"), value: customer.reservedBank ?? NO_VALUE },
            {
              label: t("customers.col.phone"),
              value: (
                <RevealableField
                  customerId={customer.id}
                  field="phone_number"
                  label={t("customers.col.phone")}
                  masked={customer.phone}
                  canReveal={reveal}
                />
              ),
            },
            {
              label: t("customers.col.email"),
              value: (
                <RevealableField
                  customerId={customer.id}
                  field="email"
                  label={t("customers.col.email")}
                  masked={customer.email}
                  canReveal={reveal}
                />
              ),
            },
            {
              label: t("customers.summary.dob"),
              value: (
                <RevealableField
                  customerId={customer.id}
                  field="date_of_birth"
                  label={t("customers.summary.dob")}
                  masked="••••••"
                  canReveal={reveal}
                />
              ),
            },
            { label: t("customers.summary.gender"), value: t(`gender.${customer.gender}`) },
            {
              label: t("customers.summary.referral"),
              value: customer.referralCode ?? t("common.notAvailable"),
            },
            { label: t("customers.col.joined"), value: <DateText iso={customer.joinedAt} /> },
            {
              label: t("customers.summary.merchant"),
              value: <BooleanBadge value={customer.hasMerchantAccount} />,
            },
          ]}
        />
      </SectionCard>

      <SectionCard title={t("customers.summary.limits")} className="min-w-0">
        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-text">{t("customers.summary.dailyUsage")}</span>
          <span className="tabular text-right text-ink">
            <MoneyText kobo={customer.dailyUsedKobo} />
          </span>
        </div>
        <progress
          value={usedPercent}
          max={100}
          aria-label={t("customers.summary.dailyUsage")}
          className={`h-2 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-neutral-bg ${
            usedPercent > 85
              ? "[&::-webkit-progress-value]:bg-danger [&::-moz-progress-bar]:bg-danger"
              : "[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
          }`}
        />
        <p className="m-0 mt-1 text-xs text-muted-text">
          {t("customers.summary.percentUsed", { percent: usedPercent })}
        </p>
        <dl className="m-0 mt-4 flex flex-col gap-2 border-t border-border-soft pt-3 text-sm">
          {(
            [
              [t("customers.summary.dailyLimit"), customer.dailyLimitKobo],
              [t("customers.summary.perTxn"), customer.perTransactionLimitKobo],
            ] as [string, number][]
          ).map(([label, kobo]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-text">{label}</dt>
              <dd className="tabular m-0 text-right font-medium text-ink">
                <MoneyText kobo={kobo} />
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard
        title={t("customers.summary.verification")}
        description={t("customers.verify.progress", { done, total: checks.length })}
        flush
        className="min-w-0 lg:col-span-3"
      >
        <ul className="m-0 grid list-none grid-cols-1 p-0 md:grid-cols-2 lg:grid-cols-3">
          {checks.map(([label, ok]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-2.5 text-sm text-ink"
            >
              <span className="min-w-0">{label}</span>
              <BooleanBadge value={ok} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
