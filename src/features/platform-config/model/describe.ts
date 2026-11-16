import { t } from "@/shared/i18n/t";
import { formatKobo } from "@/shared/lib/format";
import type { FeeRule, LimitRule } from "./types";

/** A fee in plain words, e.g. "₦25.00" or "1.5% (up to ₦5,000.00)". */
export function describeFee(fee: FeeRule): string {
  if (fee.mode === "flat") return formatKobo(fee.flatKobo);
  const percent = `${fee.percentBps / 100}%`;
  return fee.capKobo > 0
    ? t("config.fee.percentCapped", { percent, cap: formatKobo(fee.capKobo) })
    : percent;
}

export function describeLimit(limit: LimitRule): string {
  return t("config.limit.value", {
    single: formatKobo(limit.singleKobo),
    daily: formatKobo(limit.dailyKobo),
  });
}

/** The rows that differ between two lists, as "Label: old → new". */
export function feeChanges(live: FeeRule[], proposed: FeeRule[]): string[] {
  return proposed.flatMap((fee) => {
    const before = live.find((item) => item.id === fee.id);
    if (!before || describeFee(before) === describeFee(fee)) return [];
    return [`${t(`config.fee.${fee.id}`)}: ${describeFee(before)} → ${describeFee(fee)}`];
  });
}

export function limitChanges(live: LimitRule[], proposed: LimitRule[]): string[] {
  return proposed.flatMap((limit) => {
    const before = live.find((item) => item.tier === limit.tier);
    if (!before || describeLimit(before) === describeLimit(limit)) return [];
    return [
      `${t(`config.tier.${limit.tier}`)}: ${describeLimit(before)} → ${describeLimit(limit)}`,
    ];
  });
}
