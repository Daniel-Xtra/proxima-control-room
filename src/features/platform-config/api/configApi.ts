import { getAuditActor, recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { daysAgo } from "@/shared/api/mockFixtures";
import { feeProblems, limitProblems } from "../model/validate";
import type {
  FeeRule,
  KillSwitch,
  LimitRule,
  PendingFees,
  PendingLimits,
  PlatformConfig,
  Section,
  SwitchId,
} from "../model/types";

const naira = (n: number) => n * 100;

const SWITCH_START: SwitchId[] = ["transfers", "bills", "bulk", "savings", "signups", "broadcasts"];

let config: PlatformConfig = {
  version: 1,
  fees: [
    { id: "transferBank", mode: "flat", flatKobo: naira(25), percentBps: 0, capKobo: 0 },
    { id: "transferInternal", mode: "flat", flatKobo: 0, percentBps: 0, capKobo: 0 },
    { id: "bill", mode: "flat", flatKobo: naira(100), percentBps: 0, capKobo: 0 },
    { id: "bulk", mode: "flat", flatKobo: naira(20), percentBps: 0, capKobo: 0 },
    { id: "earlyWithdrawal", mode: "percent", flatKobo: 0, percentBps: 150, capKobo: naira(5000) },
  ],
  limits: [
    { tier: "none", singleKobo: naira(20_000), dailyKobo: naira(50_000) },
    { tier: "level1", singleKobo: naira(200_000), dailyKobo: naira(500_000) },
    { tier: "level2", singleKobo: naira(5_000_000), dailyKobo: naira(10_000_000) },
  ],
  switches: SWITCH_START.map((id) => ({
    id,
    enabled: true,
    changedBy: "System",
    changedAt: daysAgo(40, 9),
    reason: "Initial setup",
  })),
  pendingFees: null,
  pendingLimits: null,
};

export function getConfig(): Promise<PlatformConfig> {
  return simulate(() => structuredClone(config));
}

export function proposeFees(fees: FeeRule[], reason: string): Promise<void> {
  return simulate(() => {
    if (feeProblems(fees).length > 0) throw new ApiError(422, "Fix the fees before submitting.");
    const pending: PendingFees = {
      fees: structuredClone(fees),
      proposedBy: getAuditActor(),
      proposedAt: new Date().toISOString(),
      reason,
    };
    config = { ...config, pendingFees: pending };
    recordAudit({ action: "config.fees.propose", target: "Fees", reason });
  });
}

export function proposeLimits(limits: LimitRule[], reason: string): Promise<void> {
  return simulate(() => {
    if (limitProblems(limits).length > 0) {
      throw new ApiError(422, "Fix the limits before submitting.");
    }
    const pending: PendingLimits = {
      limits: structuredClone(limits),
      proposedBy: getAuditActor(),
      proposedAt: new Date().toISOString(),
      reason,
    };
    config = { ...config, pendingLimits: pending };
    recordAudit({ action: "config.limits.propose", target: "Transaction limits", reason });
  });
}

/** A second person approves or rejects. The person who proposed a change cannot decide it. */
export function decideChange(section: Section, approve: boolean, reason: string): Promise<void> {
  return simulate(() => {
    const pending = section === "fees" ? config.pendingFees : config.pendingLimits;
    if (!pending) throw new ApiError(404, "There is no change waiting for approval.");
    if (pending.proposedBy === getAuditActor()) {
      throw new ApiError(403, "You proposed this change, so someone else has to decide it.");
    }
    if (section === "fees") {
      const fees = (pending as PendingFees).fees;
      config = approve
        ? { ...config, fees, pendingFees: null, version: config.version + 1 }
        : { ...config, pendingFees: null };
    } else {
      const limits = (pending as PendingLimits).limits;
      config = approve
        ? { ...config, limits, pendingLimits: null, version: config.version + 1 }
        : { ...config, pendingLimits: null };
    }
    recordAudit({
      action: `config.${section}.${approve ? "approve" : "reject"}`,
      target: section === "fees" ? "Fees" : "Transaction limits",
      reason,
    });
  });
}

export function setKillSwitch(id: SwitchId, enabled: boolean, reason: string): Promise<void> {
  return simulate(() => {
    const current = config.switches.find((item) => item.id === id);
    if (!current) throw new ApiError(404, "Switch not found.");
    const next: KillSwitch = {
      ...current,
      enabled,
      changedBy: getAuditActor(),
      changedAt: new Date().toISOString(),
      reason,
    };
    config = { ...config, switches: config.switches.map((item) => (item.id === id ? next : item)) };
    recordAudit({
      action: `config.kill_switch.${enabled ? "on" : "off"}`,
      target: id,
      reason,
      before: current.enabled ? "running" : "stopped",
      after: enabled ? "running" : "stopped",
    });
  });
}
