import { humanize } from "@/shared/lib/format";
import { request, type Page } from "@/shared/api/client";

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

interface LockRow {
  max_failed_attempts: number;
  lock_duration_minutes: number;
  reset_window_minutes: number;
  is_enabled: boolean;
  updated_by_admin_name: string | null;
  updated_at: string;
}

function toPolicy(row: LockRow): LockPolicy {
  return {
    enabled: row.is_enabled,
    maxFailedAttempts: row.max_failed_attempts,
    lockMinutes: row.lock_duration_minutes,
    resetWindowMinutes: row.reset_window_minutes,
    updatedBy: row.updated_by_admin_name ?? "",
    updatedAt: row.updated_at,
  };
}

export async function getLockPolicy(): Promise<LockPolicy> {
  return toPolicy(await request<LockRow>("/admin/account-lock-settings"));
}

export async function saveLockPolicy(
  next: Omit<LockPolicy, "updatedBy" | "updatedAt">,
  _actor: string,
  _reason: string,
) {
  await request<LockRow>("/admin/account-lock-settings", {
    method: "PUT",
    body: {
      max_failed_attempts: next.maxFailedAttempts,
      lock_duration_minutes: next.lockMinutes,
      reset_window_minutes: next.resetWindowMinutes,
      is_enabled: next.enabled,
    },
  });
}

export async function clearPolicyCache(_reason: string) {
  await request("/admin/account-lock-settings/clear-cache", { method: "POST" });
}

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
  /** The fields below feed the detail view. */
  actorId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
}

interface AuditRow {
  id: string;
  occurred_at: string;
  actor_name: string | null;
  actor_id: string | null;
  actor_role?: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  outcome: "success" | "failure" | "denied";
  ip_address: string | null;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

const show = (value: Record<string, unknown> | null) => (value ? JSON.stringify(value) : undefined);

export async function listAuditPage(filters: {
  search: string;
  status: string;
  page?: number;
  limit?: number;
  /** Only events about this record, such as one customer. */
  targetId?: string;
}): Promise<Page<AuditEntry>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 100;
  const result = await request<{ data: AuditRow[]; total?: number }>("/admin/audit-logs", {
    query: {
      search: filters.search.trim() || undefined,
      target_id: filters.targetId,
      // "Failed" means the failure outcome; denied attempts show under "any".
      status:
        filters.status === "success"
          ? "success"
          : filters.status === "failed"
            ? "failure"
            : undefined,
      page,
      limit,
    },
  });
  const items: AuditEntry[] = result.data.map((row) => ({
    id: row.id,
    at: row.occurred_at,
    actor: row.actor_name ?? row.actor_id ?? "",
    action: humanize(row.action),
    target: [humanize(row.target_type), row.target_id].filter(Boolean).join(" "),
    status: row.outcome === "success" ? "success" : "failed",
    ip: row.ip_address ?? "",
    reason: row.reason ?? undefined,
    before: show(row.before),
    after: show(row.after),
    actorId: row.actor_id ?? "",
    actorRole: humanize(row.actor_role),
    targetType: humanize(row.target_type),
    targetId: row.target_id ?? "",
    beforeData: row.before,
    afterData: row.after,
  }));
  return { items, total: result.total ?? items.length, page, limit };
}

/** The latest events, for panels that show a short list. */
export async function listAuditLog(filters: {
  search: string;
  status: string;
  targetId?: string;
}): Promise<AuditEntry[]> {
  return (await listAuditPage({ ...filters, limit: 100 })).items;
}
