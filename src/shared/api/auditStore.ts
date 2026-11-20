/**
 * The name of the signed-in admin, kept for display in confirmations. The audit trail itself is
 * written by the admin API, so nothing is recorded here.
 */
let actorName = "Unknown";

export function setAuditActor(name: string) {
  actorName = name;
}

export function getAuditActor(): string {
  return actorName;
}
