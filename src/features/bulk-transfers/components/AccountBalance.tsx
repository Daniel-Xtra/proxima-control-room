import { Skeleton } from "@/shared/components/ui/Skeleton";
import { MoneyText } from "@/shared/components/MoneyText";
import { t } from "@/shared/i18n/t";
import type { BalanceInfo } from "../model/types";

/** "Available balance" for the selected payout account, with loading and error states. */
export function AccountBalance({ balance }: { balance: BalanceInfo }) {
  return (
    <p className="m-0 mt-2 flex items-baseline gap-2 text-sm text-muted-text">
      {t("bulk.balance.available")}
      {balance.status === "pending" ? (
        <Skeleton className="inline-block h-4 w-24 align-middle" />
      ) : balance.status === "error" || balance.kobo === undefined ? (
        <span className="text-danger-text">{t("bulk.balance.unavailable")}</span>
      ) : (
        <MoneyText kobo={balance.kobo} className="font-semibold text-ink" />
      )}
    </p>
  );
}
