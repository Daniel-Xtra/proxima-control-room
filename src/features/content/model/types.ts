export const BANNER_TYPES = [
  "info",
  "promotion",
  "feature",
  "warning",
  "announcement",
  "notification_promo",
] as const;
export const DISPLAY_TYPES = ["card", "banner", "popup", "inline"] as const;

export type BannerType = (typeof BANNER_TYPES)[number];
export type DisplayType = (typeof DISPLAY_TYPES)[number];

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  actionUrl: string;
  actionText: string;
  type: BannerType;
  displayType: DisplayType;
  priority: number;
  active: boolean;
  impressions: number;
  clicks: number;
}

export type BannerDraft = Omit<Banner, "id" | "impressions" | "clicks">;

export const EMPTY_DRAFT: BannerDraft = {
  title: "",
  description: "",
  imageUrl: "",
  actionUrl: "",
  actionText: "",
  type: "info",
  displayType: "card",
  priority: 1,
  active: true,
};
