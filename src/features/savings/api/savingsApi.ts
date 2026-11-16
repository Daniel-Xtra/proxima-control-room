import { recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { FIXTURE_CUSTOMERS, daysAgo, seeded } from "@/shared/api/mockFixtures";
import type { BreakagePreview, FixedDeposit, Frequency, TargetSaving } from "../model/types";

let deposits: FixedDeposit[] | null = null;
let targets: TargetSaving[] | null = null;

function buildDeposits(): FixedDeposit[] {
  const rand = seeded(31);
  return Array.from({ length: 26 }, (_, index) => {
    const customer = FIXTURE_CUSTOMERS[(index * 5) % FIXTURE_CUSTOMERS.length]!;
    const durationDays = [30, 60, 90, 180, 365][index % 5]!;
    const started = 10 + Math.floor(rand() * 120);
    const matured = started >= durationDays;
    return {
      id: `00000000-0000-4000-8000-0003${index.toString(16).padStart(8, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      principalKobo: Math.round((rand() * 4_900_000 + 100_000) * 100),
      interestRatePercent: 10 + (index % 5),
      durationDays,
      startedAt: daysAgo(started),
      maturesAt: daysAgo(started - durationDays),
      locked: !matured,
      status: matured
        ? index % 3 === 0
          ? "paid"
          : "matured"
        : index % 11 === 0
          ? "liquidated"
          : "active",
    };
  });
}

function buildTargets(): TargetSaving[] {
  const rand = seeded(47);
  const names = ["School fees", "New laptop", "Rent", "Wedding", "Emergency fund", "Holiday"];
  const frequencies: Frequency[] = ["daily", "weekly", "monthly"];
  return Array.from({ length: 24 }, (_, index) => {
    const customer = FIXTURE_CUSTOMERS[(index * 7) % FIXTURE_CUSTOMERS.length]!;
    const targetKobo = Math.round((rand() * 1_900_000 + 100_000) * 100);
    const status = (["active", "active", "active", "cancelled", "matured", "paid"] as const)[
      index % 6
    ]!;
    return {
      id: `00000000-0000-4000-8000-0004${index.toString(16).padStart(8, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      name: names[index % names.length]!,
      targetKobo,
      savedKobo:
        status === "matured" || status === "paid"
          ? targetKobo
          : Math.round(targetKobo * rand() * 0.8),
      frequency: frequencies[index % 3]!,
      startedAt: daysAgo(10 + index * 3),
      status,
    };
  });
}

const fixed = () => (deposits ??= buildDeposits());
const target = () => (targets ??= buildTargets());

export function listFixedDeposits(customerId?: string) {
  return simulate(() => fixed().filter((d) => !customerId || d.customerId === customerId));
}

export function listTargetSavings(customerId?: string) {
  return simulate(() => target().filter((d) => !customerId || d.customerId === customerId));
}

/** Early liquidation carries a breakage fee that is previewed first. */
export function previewBreakage(id: string): Promise<BreakagePreview> {
  return simulate(() => {
    const deposit = fixed().find((d) => d.id === id);
    if (deposit) {
      const accrued = Math.round(
        deposit.principalKobo * (deposit.interestRatePercent / 100) * 0.05,
      );
      const fee = Math.round(accrued * 0.5);
      return {
        principalKobo: deposit.principalKobo,
        accruedInterestKobo: accrued,
        breakageFeeKobo: fee,
        payoutKobo: deposit.principalKobo + accrued - fee,
      };
    }
    const saving = target().find((d) => d.id === id);
    if (!saving) throw new ApiError(404, "Savings plan not found.");
    const fee = Math.round(saving.savedKobo * 0.01);
    return {
      principalKobo: saving.savedKobo,
      accruedInterestKobo: 0,
      breakageFeeKobo: fee,
      payoutKobo: saving.savedKobo - fee,
    };
  }, 300);
}

export function liquidateFixedDeposit(id: string, reason: string) {
  return simulate(() => {
    const deposit = fixed().find((d) => d.id === id);
    if (!deposit) throw new ApiError(404, "Fixed deposit not found.");
    if (deposit.status !== "active")
      throw new ApiError(409, "Only active deposits can be liquidated.");
    deposit.status = "liquidated";
    deposit.locked = false;
    recordAudit({
      action: "savings.fixed.liquidate",
      target: deposit.customerName,
      reason,
      before: "active",
      after: "liquidated",
    });
  }, 600);
}

export function liquidateTargetSaving(id: string, reason: string) {
  return simulate(() => {
    const saving = target().find((d) => d.id === id);
    if (!saving) throw new ApiError(404, "Target savings not found.");
    if (saving.status !== "active") throw new ApiError(409, "Only active plans can be liquidated.");
    saving.status = "cancelled";
    recordAudit({
      action: "savings.target.liquidate",
      target: saving.customerName,
      reason,
      before: "active",
      after: "cancelled",
    });
  }, 600);
}
