import { request, type Page } from "@/shared/api/client";

export interface WhitelistEntry {
  id: string;
  service: string;
  ip: string;
  note: string;
  /** 1 to 100. */
  priority: number;
  active: boolean;
  /** When the address stops being accepted, or null when it never expires. */
  expiresAt: string | null;
  addedBy: string;
  addedAt: string;
}

export interface WhitelistInput {
  service: string;
  ip: string;
  note: string;
  priority?: number;
  active?: boolean;
  /** ISO time, or null to never expire. */
  expiresAt?: string | null;
}

interface Row {
  id: number;
  ip_address: string;
  service_name: string;
  description: string;
  priority: number;
  is_active: boolean;
  expires_at: string | null;
  added_by_admin_name?: string | null;
  created_at: string;
}

const toEntry = (row: Row): WhitelistEntry => ({
  id: String(row.id),
  service: row.service_name,
  ip: row.ip_address,
  note: row.description,
  priority: row.priority,
  active: row.is_active,
  expiresAt: row.expires_at,
  addedBy: row.added_by_admin_name ?? "",
  addedAt: row.created_at,
});

const body = (input: WhitelistInput) => ({
  ip_address: input.ip,
  service_name: input.service,
  description: input.note,
  ...(input.priority === undefined ? {} : { priority: input.priority }),
  ...(input.active === undefined ? {} : { is_active: input.active }),
  // An empty expiry is simply left out; the API has no way to clear one once set.
  ...(input.expiresAt ? { expires_at: input.expiresAt } : {}),
});

/** One page of active addresses. The API lists active entries only. */
export async function listWhitelist(
  page: number,
  limit: number,
  search = "",
): Promise<Page<WhitelistEntry>> {
  const result = await request<{ data: Row[]; total?: number }>("/admin/webhook-ip-whitelist", {
    query: { page, limit, search: search.trim() || undefined },
  });
  return {
    items: result.data.map(toEntry),
    total: result.total ?? result.data.length,
    page,
    limit,
  };
}

/** Active addresses per service. */
export async function whitelistStatistics(): Promise<{ service: string; count: number }[]> {
  const rows = await request<{ service_name: string; count: number }[]>(
    "/admin/webhook-ip-whitelist/statistics/services",
  );
  return rows.map((row) => ({ service: row.service_name, count: row.count }));
}

export async function addWhitelistEntry(input: WhitelistInput) {
  await request("/admin/webhook-ip-whitelist", { method: "POST", body: body(input) });
}

export async function updateWhitelistEntry(id: string, input: WhitelistInput) {
  await request(`/admin/webhook-ip-whitelist/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: body(input),
  });
}

export async function removeWhitelistEntry(id: string) {
  await request(`/admin/webhook-ip-whitelist/${encodeURIComponent(id)}`, { method: "DELETE" });
}
