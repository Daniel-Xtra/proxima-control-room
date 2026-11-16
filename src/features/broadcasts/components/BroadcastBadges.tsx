import { BellRinging, ChatText, EnvelopeSimple, type Icon } from "@phosphor-icons/react";
import { defineStatusBadge } from "@/shared/components/defineStatusBadge";
import { t } from "@/shared/i18n/t";
import type { BroadcastStatus, Channel, DeliveryStatus } from "../model/types";

export const BroadcastStatusBadge = defineStatusBadge<BroadcastStatus>({
  pending_approval: { tone: "warning", label: t("broadcasts.status.pending_approval") },
  scheduled: { tone: "info", label: t("broadcasts.status.scheduled") },
  sent: { tone: "success", label: t("broadcasts.status.sent") },
  rejected: { tone: "neutral", label: t("broadcasts.status.rejected") },
});

export const DeliveryStatusBadge = defineStatusBadge<DeliveryStatus>({
  delivered: { tone: "success", label: t("broadcasts.delivery.delivered") },
  failed: { tone: "danger", label: t("broadcasts.delivery.failed") },
});

export const CHANNEL_ICONS: Record<Channel, Icon> = {
  push: BellRinging,
  sms: ChatText,
  email: EnvelopeSimple,
};

/** Channel as an icon plus its name, so it is never colour or icon alone. */
export function ChannelLabel({ channel }: { channel: Channel }) {
  const Glyph = CHANNEL_ICONS[channel];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Glyph aria-hidden="true" size={14} />
      {t(`broadcasts.channel.${channel}`)}
    </span>
  );
}
