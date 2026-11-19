import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { useCan } from "@/features/auth";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { DateText } from "@/shared/components/DateText";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatCard } from "@/shared/components/StatCard";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={t("customers.summary.balance")}
          value={<MoneyText kobo={customer.balanceKobo} />}
        />
        <StatCard
          label={t("customers.summary.ledger")}
          value={<MoneyText kobo={customer.ledgerBalanceKobo} />}
        />
        <StatCard
          label={t("customers.summary.moneyIn")}
          value={<MoneyText kobo={customer.moneyInKobo} />}
        />
        <StatCard
          label={t("customers.summary.moneyOut")}
          value={<MoneyText kobo={customer.moneyOutKobo} />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t("customers.summary.limits")}>
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-text">{t("customers.summary.dailyUsage")}</span>
                <span className="tabular text-ink">
                  <MoneyText kobo={customer.dailyUsedKobo} /> /{" "}
                  <MoneyText kobo={customer.dailyLimitKobo} />
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
              <p className="mt-1 text-xs text-muted-text">
                {t("customers.summary.percentUsed", { percent: usedPercent })}
              </p>
            </div>
            <KeyValueList
              items={[
                {
                  label: t("customers.summary.perTxn"),
                  value: <MoneyText kobo={customer.perTransactionLimitKobo} />,
                },
                {
                  label: t("customers.summary.dailyLimit"),
                  value: <MoneyText kobo={customer.dailyLimitKobo} />,
                },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title={t("customers.summary.identity")}>
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
      </div>

      <SectionCard title={t("customers.summary.verification")}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              [t("customers.verify.phone"), customer.phoneVerified],
              [t("customers.verify.email"), customer.emailVerified],
              [t("customers.verify.kyc"), customer.kycCompleted],
              [t("customers.verify.pin"), customer.pinSet],
              [t("customers.verify.address"), customer.addressSet],
              [t("customers.verify.docs"), customer.complianceDocsSet],
            ] as [string, boolean][]
          ).map(([label, ok]) => (
            <li key={label} className="flex items-center gap-2 text-base">
              {ok ? (
                <CheckCircle aria-hidden="true" weight="fill" className="size-4 text-success" />
              ) : (
                <XCircle aria-hidden="true" weight="fill" className="size-4 text-danger-text" />
              )}
              <span>{label}</span>
              <span className="sr-only">{ok ? t("common.yes") : t("common.no")}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
