import { Megaphone } from "@phosphor-icons/react";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import type { BannerDraft, BannerType } from "../model/types";

const TYPE_TONE: Record<BannerType, string> = {
  info: "bg-info-bg text-info",
  promotion: "bg-primary-soft text-primary",
  feature: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  announcement: "bg-neutral-bg text-ink",
  notification_promo: "bg-locked-bg text-locked",
};

/** Approximates how the mobile app renders each display type. */
export function BannerPreview({ draft }: { draft: BannerDraft }) {
  const title = draft.title || t("banners.preview.titlePlaceholder");
  const body = draft.description || t("banners.preview.bodyPlaceholder");
  const action = draft.actionText ? (
    <span className="mt-2 inline-block rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-ink">
      {draft.actionText}
    </span>
  ) : null;

  return (
    <figure
      className="rounded-lg border border-border bg-surface-muted p-3"
      aria-label={t("banners.preview.title")}
    >
      <figcaption className="mb-2 text-xs text-muted-text">
        {t("banners.preview.title")} · {t(`banners.display.${draft.displayType}`)}
      </figcaption>
      <div className="mx-auto w-64 rounded-xl border border-border-strong bg-surface p-2">
        {draft.displayType === "popup" ? (
          <div className="rounded-lg bg-overlay p-4">
            <div className="rounded-lg bg-surface p-3 text-center shadow-md">
              <Megaphone aria-hidden="true" className="mx-auto mb-1 size-6 text-primary" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-text">{body}</p>
              {action}
            </div>
          </div>
        ) : draft.displayType === "banner" ? (
          <div className={cn("rounded-md px-3 py-2 text-xs", TYPE_TONE[draft.type])}>
            <p className="font-semibold">{title}</p>
            <p>{body}</p>
          </div>
        ) : draft.displayType === "inline" ? (
          <p className="border-l-2 border-primary pl-2 text-xs">
            <span className="font-semibold">{title}</span>{" "}
            <span className="text-muted-text">{body}</span>
          </p>
        ) : (
          <div className="rounded-lg border border-border p-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                TYPE_TONE[draft.type],
              )}
            >
              {t(`banners.type.${draft.type}`)}
            </span>
            <p className="mt-1.5 text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-text">{body}</p>
            {action}
          </div>
        )}
      </div>
    </figure>
  );
}
