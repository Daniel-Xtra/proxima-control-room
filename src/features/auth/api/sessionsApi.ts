import { request } from "@/shared/api/client";

export interface SessionRow {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface SessionSummary {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  last_seen_at: string;
  current: boolean;
}

export async function listSessions(): Promise<SessionRow[]> {
  const rows = await request<SessionSummary[]>("/admin/auth/sessions");
  return rows.map((row) => ({
    id: row.id,
    device: row.user_agent ?? "",
    ip: row.ip_address ?? "",
    lastActive: row.last_seen_at,
    current: row.current,
  }));
}

export async function revokeSession(id: string) {
  await request(`/admin/auth/sessions/${encodeURIComponent(id)}/revoke`, { method: "POST" });
}

/** Signs out every session except the one in use. */
export async function revokeOtherSessions(sessions: SessionRow[]) {
  await Promise.all(sessions.filter((row) => !row.current).map((row) => revokeSession(row.id)));
}
