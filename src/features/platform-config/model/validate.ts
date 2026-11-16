import type { FeeRule, LimitRule } from "./types";

export const MAX_FLAT_FEE_KOBO = 500_000; // ₦5,000
export const MAX_PERCENT_BPS = 1_000; // 10%
export const MAX_LIMIT_KOBO = 10_000_000_000; // ₦100,000,000

export type ConfigProblem =
  | "config.err.fee.flat"
  | "config.err.fee.percent"
  | "config.err.fee.cap"
  | "config.err.limit.single"
  | "config.err.limit.daily"
  | "config.err.limit.order";

const whole = (n: number) => Number.isInteger(n);

export function feeProblems(fees: FeeRule[]): ConfigProblem[] {
  const found = new Set<ConfigProblem>();
  for (const fee of fees) {
    if (!whole(fee.flatKobo) || fee.flatKobo < 0 || fee.flatKobo > MAX_FLAT_FEE_KOBO) {
      found.add("config.err.fee.flat");
    }
    if (!whole(fee.percentBps) || fee.percentBps < 0 || fee.percentBps > MAX_PERCENT_BPS) {
      found.add("config.err.fee.percent");
    }
    if (!whole(fee.capKobo) || fee.capKobo < 0 || fee.capKobo > MAX_LIMIT_KOBO) {
      found.add("config.err.fee.cap");
    }
  }
  return [...found];
}

export function limitProblems(limits: LimitRule[]): ConfigProblem[] {
  const found = new Set<ConfigProblem>();
  limits.forEach((limit, index) => {
    if (!whole(limit.singleKobo) || limit.singleKobo <= 0 || limit.singleKobo > MAX_LIMIT_KOBO) {
      found.add("config.err.limit.single");
    }
    if (
      !whole(limit.dailyKobo) ||
      limit.dailyKobo < limit.singleKobo ||
      limit.dailyKobo > MAX_LIMIT_KOBO
    ) {
      found.add("config.err.limit.daily");
    }
    const lower = limits[index - 1];
    if (lower && (limit.singleKobo < lower.singleKobo || limit.dailyKobo < lower.dailyKobo)) {
      found.add("config.err.limit.order");
    }
  });
  return [...found];
}

/** "1,500.50" or "1500.5" to kobo. Anything that is not a number gives NaN, which fails validation. */
export function nairaToKobo(text: string): number {
  const cleaned = text.replaceAll(",", "").trim();
  return cleaned === "" ? 0 : Math.round(Number(cleaned) * 100);
}

export const koboToNaira = (kobo: number): string => String(kobo / 100);

export function percentToBps(text: string): number {
  const cleaned = text.trim();
  return cleaned === "" ? 0 : Math.round(Number(cleaned) * 100);
}

export const bpsToPercent = (bps: number): string => String(bps / 100);
