import { listAudit, recordAudit, type AuditEntry } from "@/shared/api/auditStore";
import { simulate } from "@/shared/api/client";
import { daysAgo } from "@/shared/api/mockFixtures";

export interface LockPolicy {
  enabled: boolean;
  maxFailedAttempts: number;
  lockMinutes: number;
  resetWindowMinutes: number;
  updatedBy: string;
  updatedAt: string;
}

export const DEFAULT_POLICY: Omit<LockPolicy, "updatedBy" | "updatedAt"> = {
  enabled: true,
  maxFailedAttempts: 5,
  lockMinutes: 30,
  resetWindowMinutes: 15,
};

let policy: LockPolicy = {
  ...DEFAULT_POLICY,
  lockMinutes: 60,
  updatedBy: "Chuka Obi",
  updatedAt: daysAgo(12),
};

export const getLockPolicy = () => simulate(() => ({ ...policy }));

export function saveLockPolicy(
  next: Omit<LockPolicy, "updatedBy" | "updatedAt">,
  actor: string,
  reason: string,
) {
  return simulate(() => {
    const before = `${policy.maxFailedAttempts} attempts, ${policy.lockMinutes} min`;
    policy = { ...next, updatedBy: actor, updatedAt: new Date().toISOString() };
    recordAudit({
      action: "policy.account_lock.update",
      target: "Account-lock policy",
      reason,
      before,
      after: `${next.maxFailedAttempts} attempts, ${next.lockMinutes} min`,
    });
  });
}

export function clearPolicyCache(reason: string) {
  return simulate(() => {
    recordAudit({
      action: "policy.account_lock.clear_cache",
      target: "Account-lock policy",
      reason,
    });
  });
}

export interface WhitelistEntry {
  id: string;
  service: string;
  ip: string;
  note: string;
  addedBy: string;
  addedAt: string;
}

let whitelist: WhitelistEntry[] = [
  {
    id: "w1",
    service: "BankOne",
    ip: "41.206.4.162",
    note: "Production webhook",
    addedBy: "Chuka Obi",
    addedAt: daysAgo(90),
  },
  {
    id: "w2",
    service: "BankOne",
    ip: "41.206.4.163",
    note: "Failover",
    addedBy: "Chuka Obi",
    addedAt: daysAgo(90),
  },
  {
    id: "w3",
    service: "Airtime provider",
    ip: "102.216.128.10",
    note: "Callbacks",
    addedBy: "Ife Johnson",
    addedAt: daysAgo(44),
  },
  {
    id: "w4",
    service: "Bills provider",
    ip: "154.113.16.8",
    note: "Callbacks",
    addedBy: "Ife Johnson",
    addedAt: daysAgo(30),
  },
  {
    id: "w5",
    service: "Bills provider",
    ip: "154.113.16.9",
    note: "Callbacks (secondary)",
    addedBy: "Ife Johnson",
    addedAt: daysAgo(30),
  },
  {
    id: "w6",
    service: "KYC provider",
    ip: "34.240.11.20",
    note: "Identity webhooks",
    addedBy: "Tolu Adebayo",
    addedAt: daysAgo(8),
  },
];

export const listWhitelist = () => simulate(() => [...whitelist]);

export function addWhitelistEntry(
  entry: Pick<WhitelistEntry, "service" | "ip" | "note">,
  actor: string,
  reason: string,
) {
  return simulate(() => {
    whitelist = [
      ...whitelist,
      { ...entry, id: crypto.randomUUID(), addedBy: actor, addedAt: new Date().toISOString() },
    ];
    recordAudit({ action: "webhook_ip.add", target: `${entry.service} ${entry.ip}`, reason });
  });
}

export function removeWhitelistEntry(id: string, reason: string) {
  return simulate(() => {
    const entry = whitelist.find((e) => e.id === id);
    whitelist = whitelist.filter((e) => e.id !== id);
    recordAudit({
      action: "webhook_ip.remove",
      target: entry ? `${entry.service} ${entry.ip}` : id,
      reason,
    });
  });
}

const SAMPLE_ACTIONS = [
  "customer.login.unlock",
  "request.limit.approved",
  "request.freeze.initiate",
  "sensitive.reveal",
  "customer.statement.export",
  "request.freeze.rejected",
  "bankone.repair",
  "customer.password.reset",
];
const ACTORS = ["Tolu Adebayo", "Ife Johnson", "Chuka Obi", "Amaka Eze"];

function sampleEntries(): AuditEntry[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: `sample-${i}`,
    at: daysAgo(Math.floor(i / 3), 8 + (i % 10)),
    actor: ACTORS[i % ACTORS.length]!,
    action: SAMPLE_ACTIONS[i % SAMPLE_ACTIONS.length]!,
    target: ["Adaeze Okafor", "Chinedu Bello", "Funke Eze", "Ngozi Lawal"][i % 4]!,
    status: i % 9 === 0 ? "failed" : "success",
    ip: `102.89.${30 + (i % 5)}.${10 + i}`,
  }));
}

export function listAuditLog(filters: { search: string; status: string }) {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    return [...listAudit(), ...sampleEntries()]
      .filter((e) => filters.status === "all" || e.status === filters.status)
      .filter(
        (e) =>
          !needle || `${e.actor} ${e.action} ${e.target} ${e.ip}`.toLowerCase().includes(needle),
      );
  }, 300);
}
