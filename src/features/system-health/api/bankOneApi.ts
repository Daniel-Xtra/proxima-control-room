import { recordAudit } from "@/shared/api/auditStore";
import { simulate } from "@/shared/api/client";
import { FIXTURE_CUSTOMERS } from "@/shared/api/mockFixtures";

export interface MissingAccount {
  customerId: string;
  customerName: string;
  phone: string;
  queued: boolean;
}

export type RepairOutcome = "created" | "found" | "failed";
export interface RepairResult {
  customerId: string;
  customerName: string;
  outcome: RepairOutcome;
}

let missing: MissingAccount[] = [3, 11, 17, 24, 29, 35, 41].map((i) => ({
  customerId: FIXTURE_CUSTOMERS[i]!.id,
  customerName: FIXTURE_CUSTOMERS[i]!.name,
  phone: FIXTURE_CUSTOMERS[i]!.phone,
  queued: i % 2 === 0,
}));

export const getBankOneOverview = () =>
  simulate(() => ({
    customersChecked: 12_480,
    missingAccounts: missing.length,
    queued: missing.filter((m) => m.queued).length,
  }));

export const listMissingAccounts = () => simulate(() => [...missing]);

export const runHealthCheck = () =>
  simulate(() => ({ ok: true, latencyMs: 184, checkedAt: new Date().toISOString() }), 900);

function outcomeFor(index: number): RepairOutcome {
  return index % 5 === 4 ? "failed" : index % 2 ? "found" : "created";
}

export function bulkRepair(dryRun: boolean, reason: string): Promise<RepairResult[]> {
  return simulate(() => {
    const results = missing.map((m, i) => ({
      customerId: m.customerId,
      customerName: m.customerName,
      outcome: outcomeFor(i),
    }));
    if (!dryRun) {
      const failedIds = new Set(
        results.filter((r) => r.outcome === "failed").map((r) => r.customerId),
      );
      missing = missing.filter((m) => failedIds.has(m.customerId));
      recordAudit({ action: "bankone.repair.bulk", target: `${results.length} customers`, reason });
    }
    return results;
  }, 900);
}

export function repairSingle(customerId: string, reason: string): Promise<RepairResult> {
  return simulate(() => {
    const account = missing.find((m) => m.customerId === customerId);
    missing = missing.filter((m) => m.customerId !== customerId);
    recordAudit({ action: "bankone.repair", target: account?.customerName ?? customerId, reason });
    return { customerId, customerName: account?.customerName ?? "", outcome: "created" as const };
  }, 600);
}
