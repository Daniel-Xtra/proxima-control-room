import { request } from "@/shared/api/client";
import type { Banner, BannerDraft, BannerType, DisplayType } from "../model/types";

interface BannerRow {
  unique_identifier: string;
  title: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  banner_type: BannerType;
  display_type: DisplayType;
  priority: number;
  is_active: boolean;
  impressions?: number;
  clicks?: number;
}

function toBanner(row: BannerRow): Banner {
  return {
    id: row.unique_identifier,
    title: row.title,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    actionUrl: row.action_url ?? "",
    actionText: row.action_text ?? "",
    type: row.banner_type,
    displayType: row.display_type,
    priority: row.priority,
    active: row.is_active,
    impressions: row.impressions ?? null,
    clicks: row.clicks ?? null,
  };
}

export async function listBanners(): Promise<Banner[]> {
  const page = await request<{ data: BannerRow[] }>("/admin/banners", { query: { limit: 100 } });
  return page.data.map(toBanner).sort((a, b) => a.priority - b.priority);
}

/** Empty optional text is left out, because the API validates URLs and does not accept blanks. */
const blankToUndefined = (value: string) => (value.trim() === "" ? undefined : value.trim());

export async function saveBanner(draft: BannerDraft, id: string | null, _reason: string) {
  const body = {
    title: draft.title,
    description: blankToUndefined(draft.description),
    image_url: blankToUndefined(draft.imageUrl),
    action_url: blankToUndefined(draft.actionUrl),
    action_text: blankToUndefined(draft.actionText),
    banner_type: draft.type,
    display_type: draft.displayType,
    priority: draft.priority,
    is_active: draft.active,
  };
  const row = id
    ? await request<BannerRow>(`/admin/banners/${encodeURIComponent(id)}`, {
        method: "PUT",
        body,
      })
    : await request<BannerRow>("/admin/banners", { method: "POST", body });
  return toBanner(row);
}

export async function toggleBanner(id: string, _reason: string) {
  await request(`/admin/banners/${encodeURIComponent(id)}/toggle-status`, { method: "POST" });
}

export async function deleteBanner(id: string, _reason: string) {
  await request(`/admin/banners/${encodeURIComponent(id)}`, { method: "DELETE" });
}
