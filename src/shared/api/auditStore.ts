/**
 * In-memory audit trail used while the audit-log API does not exist (PRD gap 5).
 * Every privileged action and every sensitive reveal calls `recordAudit`.
 */
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  status: "success" | "failed";
  ip: string;
  reason?: string;
  before?: string;
  after?: string;
}

const entries: AuditEntry[] = [];
let actorName = "Unknown";

export function setAuditActor(name: string) {
  actorName = name;
}

export function getAuditActor(): string {
  return actorName;
}

export function recordAudit(
  input: Pick<AuditEntry, "action" | "target"> & Partial<AuditEntry>,
): AuditEntry {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: actorName,
    status: "success",
    ip: "102.89.34.17",
    ...input,
  };
  entries.unshift(entry);
  return entry;
}

export function listAudit(): AuditEntry[] {
  return entries;
}
