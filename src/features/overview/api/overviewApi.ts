import { simulate } from "@/shared/api/client";
import { FIXTURE_CUSTOMERS, daysAgo, seeded } from "@/shared/api/mockFixtures";

export interface Bucket {
  count: number;
  amountKobo: number;
}

export interface RecentTransaction {
  id: string;
  name: string;
  amountKobo: number;
  purpose:
    "wallet_transfer" | "bank_transfer" | "bill_payment" | "airtime_payment" | "data_payment";
  status: "success" | "pending" | "failed";
}

export interface Overview {
  /** Percent change against the previous period of the same length. */
  deltas: { transactions: number; value: number; fixedDeposits: number; targetSavings: number };
  valueKobo: number;
  series: { labels: string[]; valueKobo: number[]; volume: number[] };
  recent: RecentTransaction[];
  kpis: {
    transactions: { total: number; trend: number[] };
    fixedDeposits: { total: number; trend: number[] };
    targetSavings: { total: number; trend: number[] };
  };
  transfers: {
    total: Bucket;
    successful: Bucket;
    failed: Bucket;
    pending: Bucket;
    wallet: Bucket;
    otherBank: Bucket;
    weekday: { label: string; count: number }[];
  };
  bills: {
    airtime: Bucket & { successes: number; failures: number; pending: number };
    data: Bucket & { successes: number; failures: number; pending: number };
    billers: { name: string; count: number; amountKobo: number; failures: number }[];
  };
  customers: {
    signUps: number;
    trend: number[];
    male: number;
    female: number;
    unspecified: number;
  };
  savings: {
    fixedTotalKobo: number;
    fixedCount: number;
    targetTotalKobo: number;
    targetCount: number;
  };
}

export function getOverview(range: string): Promise<Overview> {
  return simulate(() => {
    const days = Number(range.replace("d", "")) || 30;
    const rand = seeded(days * 13);
    const points = (base: number) =>
      Array.from({ length: 12 }, () => Math.round(base * (0.6 + rand() * 0.8)));
    const scale = days / 30;
    const successCount = Math.round(18_400 * scale);
    const failedCount = Math.round(1_150 * scale);
    const pendingCount = Math.round(240 * scale);
    const avg = 3_800_00;
    const bucket = (count: number): Bucket => ({
      count,
      amountKobo: count * Math.round(avg * (0.8 + rand() * 0.5)),
    });
    const walletCount = Math.round(successCount * 0.58);
    const bill = (count: number) => ({
      ...bucket(count),
      successes: Math.round(count * 0.93),
      failures: Math.round(count * 0.05),
      pending: Math.round(count * 0.02),
    });
    const signUps = Math.round(2_960 * scale);
    const successful = bucket(successCount);
    const dayCount = Math.min(days, 30);
    const labels = Array.from({ length: dayCount }, (_, i) =>
      new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
        new Date(daysAgo(dayCount - 1 - i)),
      ),
    );
    const volume = Array.from({ length: dayCount }, () =>
      Math.round((successCount / dayCount) * (0.5 + rand())),
    );
    const purposes = [
      "wallet_transfer",
      "bank_transfer",
      "bill_payment",
      "airtime_payment",
      "data_payment",
    ] as const;
    return {
      deltas: {
        transactions: Math.round((rand() * 30 - 10) * 10) / 10,
        value: Math.round((rand() * 30 - 15) * 10) / 10,
        fixedDeposits: Math.round((rand() * 20 - 4) * 10) / 10,
        targetSavings: Math.round((rand() * 20 - 8) * 10) / 10,
      },
      valueKobo: successful.amountKobo,
      series: {
        labels,
        volume,
        valueKobo: volume.map((v) => v * Math.round(avg * (0.8 + rand() * 0.5))),
      },
      recent: purposes.map((purpose, i) => ({
        id: `recent-${i}`,
        name: FIXTURE_CUSTOMERS[(i * 11 + days) % FIXTURE_CUSTOMERS.length]!.name,
        amountKobo: Math.round((rand() * 480_000 + 2_000) * 100),
        purpose,
        status: i === 3 ? "pending" : i === 4 ? "failed" : "success",
      })),
      kpis: {
        transactions: { total: successCount + failedCount + pendingCount, trend: points(600) },
        fixedDeposits: { total: Math.round(412 * scale), trend: points(14) },
        targetSavings: { total: Math.round(1_020 * scale), trend: points(34) },
      },
      transfers: {
        total: bucket(successCount + failedCount + pendingCount),
        successful: bucket(successCount),
        failed: bucket(failedCount),
        pending: bucket(pendingCount),
        wallet: bucket(walletCount),
        otherBank: bucket(successCount - walletCount),
        weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
          label,
          count: Math.round((successCount / 7) * (i < 5 ? 1.1 : 0.7) * (0.85 + rand() * 0.3)),
        })),
      },
      bills: {
        airtime: bill(Math.round(5_200 * scale)),
        data: bill(Math.round(3_100 * scale)),
        billers: ["Electricity", "Cable TV", "Internet", "Betting wallet"].map((name) => ({
          name,
          count: Math.round((400 + rand() * 900) * scale),
          amountKobo: Math.round((2_000_000 + rand() * 9_000_000) * scale) * 100,
          failures: Math.round((10 + rand() * 40) * scale),
        })),
      },
      customers: {
        signUps,
        trend: points(100),
        male: Math.round(signUps * 0.48),
        female: Math.round(signUps * 0.43),
        unspecified: signUps - Math.round(signUps * 0.48) - Math.round(signUps * 0.43),
      },
      savings: {
        fixedCount: Math.round(412 * scale),
        fixedTotalKobo: Math.round(412 * scale) * 1_850_000_00,
        targetCount: Math.round(1_020 * scale),
        targetTotalKobo: Math.round(1_020 * scale) * 420_000_00,
      },
    };
  }, 500);
}
