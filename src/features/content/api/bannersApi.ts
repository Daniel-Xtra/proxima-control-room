import { recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import type { Banner, BannerDraft } from "../model/types";

let banners: Banner[] = [
  {
    id: "00000000-0000-4000-8000-000500000001",
    title: "Save with fixed deposits",
    description: "Earn up to 14% per annum on locked savings.",
    imageUrl: "",
    actionUrl: "proxima://savings/fixed",
    actionText: "Start saving",
    type: "promotion",
    displayType: "card",
    priority: 1,
    active: true,
    impressions: 48210,
    clicks: 3120,
  },
  {
    id: "00000000-0000-4000-8000-000500000002",
    title: "Scheduled maintenance",
    description: "Transfers pause Sunday 1am to 3am.",
    imageUrl: "",
    actionUrl: "",
    actionText: "",
    type: "warning",
    displayType: "banner",
    priority: 2,
    active: true,
    impressions: 90311,
    clicks: 0,
  },
  {
    id: "00000000-0000-4000-8000-000500000003",
    title: "Pay bills in two taps",
    description: "Airtime, data and electricity from your wallet.",
    imageUrl: "",
    actionUrl: "proxima://bills",
    actionText: "Try it",
    type: "feature",
    displayType: "popup",
    priority: 3,
    active: false,
    impressions: 12044,
    clicks: 902,
  },
  {
    id: "00000000-0000-4000-8000-000500000004",
    title: "Refer a friend",
    description: "Both of you get a reward after the first transfer.",
    imageUrl: "",
    actionUrl: "proxima://referral",
    actionText: "Invite",
    type: "notification_promo",
    displayType: "inline",
    priority: 4,
    active: true,
    impressions: 30118,
    clicks: 1411,
  },
];

export const listBanners = () =>
  simulate(() => [...banners].sort((a, b) => a.priority - b.priority));

export function saveBanner(draft: BannerDraft, id: string | null, reason: string) {
  return simulate(() => {
    if (id) {
      const existing = banners.find((b) => b.id === id);
      if (!existing) throw new ApiError(404, "Banner not found.");
      Object.assign(existing, draft);
      recordAudit({ action: "banner.update", target: draft.title, reason });
      return existing;
    }
    const created: Banner = { ...draft, id: crypto.randomUUID(), impressions: 0, clicks: 0 };
    banners = [...banners, created];
    recordAudit({ action: "banner.create", target: draft.title, reason });
    return created;
  });
}

export function toggleBanner(id: string, reason: string) {
  return simulate(() => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) throw new ApiError(404, "Banner not found.");
    banner.active = !banner.active;
    recordAudit({
      action: "banner.toggle",
      target: banner.title,
      reason,
      after: banner.active ? "active" : "inactive",
    });
  });
}

export function deleteBanner(id: string, reason: string) {
  return simulate(() => {
    const banner = banners.find((b) => b.id === id);
    banners = banners.filter((b) => b.id !== id);
    recordAudit({ action: "banner.delete", target: banner?.title ?? id, reason });
  });
}
