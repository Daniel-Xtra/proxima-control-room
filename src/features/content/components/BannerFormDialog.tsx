import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Input } from "@/shared/components/ui/Input";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Switch } from "@/shared/components/ui/Switch";
import { t } from "@/shared/i18n/t";
import { saveBanner } from "../api/bannersApi";
import {
  BANNER_TYPES,
  DISPLAY_TYPES,
  EMPTY_DRAFT,
  type Banner,
  type BannerDraft,
  type BannerType,
  type DisplayType,
} from "../model/types";
import { BannerPreview } from "./BannerPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
}

export function BannerFormDialog({ open, onOpenChange, banner }: Props) {
  const queryClient = useQueryClient();
  // The page remounts this dialog (via `key`) for each banner, so initial state is enough.
  const [draft, setDraft] = useState<BannerDraft>(banner ? { ...banner } : EMPTY_DRAFT);

  const set = <K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={banner ? t("banners.edit") : t("banners.create")}
      confirmLabel={t("common.save")}
      requireTotp={false}
      requireReason={false}
      blocked={draft.title.trim() === "" || draft.description.trim() === ""}
      onConfirm={async ({ reason }) => {
        await saveBanner(draft, banner?.id ?? null, reason);
        await queryClient.invalidateQueries({ queryKey: ["banners"] });
        return t("banners.saved");
      }}
    >
      <BannerPreview draft={draft} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="banner-title">{t("banners.field.title")}</Label>
        <Input
          id="banner-title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="banner-description">{t("banners.field.description")}</Label>
        <Textarea
          id="banner-description"
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-type">{t("banners.field.type")}</Label>
          <Select value={draft.type} onValueChange={(v) => set("type", v as BannerType)}>
            <SelectTrigger id="banner-type" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BANNER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`banners.type.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-display">{t("banners.field.display")}</Label>
          <Select
            value={draft.displayType}
            onValueChange={(v) => set("displayType", v as DisplayType)}
          >
            <SelectTrigger id="banner-display" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`banners.display.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-action-text">{t("banners.field.actionText")}</Label>
          <Input
            id="banner-action-text"
            value={draft.actionText}
            onChange={(e) => set("actionText", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-action-url">{t("banners.field.actionUrl")}</Label>
          <Input
            id="banner-action-url"
            value={draft.actionUrl}
            onChange={(e) => set("actionUrl", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-priority">{t("banners.field.priority")}</Label>
          <Input
            id="banner-priority"
            type="number"
            min={1}
            value={draft.priority}
            onChange={(e) => set("priority", Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 pb-1.5">
          <Switch
            id="banner-active"
            checked={draft.active}
            onCheckedChange={(v) => set("active", v)}
          />
          <Label htmlFor="banner-active">{t("banners.field.active")}</Label>
        </div>
      </div>
    </ActionDialog>
  );
}
