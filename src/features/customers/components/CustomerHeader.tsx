import { ArrowDown, Bank, Envelope, Phone, SealCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { initials } from "@/shared/lib/format";
import type { Customer, CustomerStatus } from "../model/types";

const DOT: Record<CustomerStatus, string> = {
  active: "bg-success-solid",
  frozen: "bg-danger",
  locked: "bg-danger",
  deactivated: "bg-muted-text",
};

/** Who the customer is at a glance: name, level, state, and how to reach them. The page's actions sit on the right. */
export function CustomerHeader({
  customer,
  actions,
  onMoreInfo,
}: {
  customer: Customer;
  actions?: ReactNode;
  onMoreInfo: () => void;
}) {
  const level =
    customer.kycLevel === 0 ? t("kyc.level.none") : t("kyc.level.n", { level: customer.kycLevel });

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-info-bg font-heading text-lg font-semibold text-info-text"
        >
          {initials(customer.name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="m-0 font-heading text-2xl font-semibold text-ink">{customer.name}</h2>
            <span className="inline-flex items-center gap-1 text-sm text-muted-text">
              <SealCheck
                aria-hidden="true"
                weight="fill"
                className={cn("size-4", customer.kycCompleted ? "text-info-text" : "")}
              />
              {level}
            </span>
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap items-center gap-x-4 gap-y-1.5 p-0 text-sm text-muted-text">
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", DOT[customer.status])}
              />
              <span className="text-ink">{t(`customers.status.${customer.status}`)}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Phone aria-hidden="true" className="size-4 shrink-0" />
              {customer.phone}
            </li>
            <li className="flex min-w-0 items-center gap-1.5">
              <Envelope aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{customer.email}</span>
            </li>
            {customer.reservedAccount ? (
              <li className="flex items-center gap-1.5">
                <Bank aria-hidden="true" className="size-4 shrink-0" />
                <span className="tabular">{customer.reservedAccount}</span>
                {customer.reservedBank ? <span>· {customer.reservedBank}</span> : null}
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={onMoreInfo}
                className="inline-flex cursor-pointer items-center gap-1 text-blue-strong hover:underline"
              >
                {t("customers.stats.moreInfo")}
                <ArrowDown aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          </ul>
        </div>
      </div>
      {actions}
    </div>
  );
}
