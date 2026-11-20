import { request, type Page } from "@/shared/api/client";

export interface Provider {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

interface Row {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

/** The provider names the backend accepts when a new one is requested. */
export const PROVIDER_NAMES = [
  "seerbit",
  "dojah",
  "infobip",
  "vas_coralpay",
  "bank_one",
  "inter_switch",
  "qoreid",
  "optimus_bank",
  "vfd",
  "payxy_vfd",
  "sterling_bank",
  "payrep",
  "cloudinary",
  "internal_file_service",
] as const;

/** One page of providers. */
export async function listProviders(page: number, limit: number): Promise<Page<Provider>> {
  const result = await request<{ data: Row[]; total?: number }>("/admin/providers", {
    query: { page, limit },
  });
  return {
    items: result.data.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      active: row.is_active,
    })),
    total: result.total ?? result.data.length,
    page,
    limit,
  };
}

/** Provider types already in use, offered as suggestions when requesting a new provider. */
export async function listProviderTypes(): Promise<string[]> {
  const result = await request<{ data: Row[] }>("/admin/providers", { query: { limit: 100 } });
  return [...new Set(result.data.map((row) => row.type))];
}

/** Every change is a request another admin approves; nothing changes until then. */
export function requestProviderStatus(id: string, active: boolean, reason: string) {
  return request(`/admin/providers/${encodeURIComponent(id)}/status-requests`, {
    method: "POST",
    body: { is_active: active, reason },
  });
}

export function requestProviderDelete(id: string, reason: string) {
  return request(`/admin/providers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: { reason },
  });
}

export function requestProviderCreate(input: { name: string; type: string; reason: string }) {
  return request("/admin/providers/create-requests", { method: "POST", body: input });
}
