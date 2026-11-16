import { SectionCard } from "@/shared/components/SectionCard";
import { BrandMark } from "@/shared/components/BrandMark";
import { t } from "@/shared/i18n/t";
import { SAMPLE_NAME, fillSample, smsSegments } from "../model/message";
import type { Channel } from "../model/types";

interface Props {
  channel: Channel;
  subject: string;
  body: string;
}

/** Approximates how the message looks on a phone or in an inbox. Shown with a sample name. */
export function MessagePreview({ channel, subject, body }: Props) {
  const title = fillSample(subject) || t("broadcasts.preview.emptyTitle");
  const text = fillSample(body) || t("broadcasts.preview.emptyBody");

  return (
    <SectionCard
      title={t("broadcasts.preview.title")}
      description={t("broadcasts.preview.sample", { name: SAMPLE_NAME })}
    >
      <div className="rounded-lg bg-surface-muted p-3">
        {channel === "push" ? (
          <div className="flex gap-2.5 rounded-xl border border-border bg-surface p-3 shadow-sm">
            <BrandMark className="h-9" />
            <div className="min-w-0">
              <p className="m-0 text-xs text-muted-text">{t("broadcasts.preview.appName")}</p>
              <p className="m-0 break-words text-sm font-semibold text-ink">{title}</p>
              <p className="m-0 break-words text-sm text-body">{text}</p>
            </div>
          </div>
        ) : null}

        {channel === "sms" ? (
          <div>
            <p className="m-0 mb-1 text-xs text-muted-text">{t("broadcasts.preview.sender")}</p>
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-surface px-3 py-2 text-sm text-ink shadow-sm">
              <p className="m-0 whitespace-pre-wrap break-words">{text}</p>
            </div>
            <p className="m-0 mt-1 text-xs text-muted-text">
              {t("broadcasts.preview.segments", { count: smsSegments(fillSample(body).length) })}
            </p>
          </div>
        ) : null}

        {channel === "email" ? (
          <div className="rounded-md border border-border bg-surface">
            <div className="border-b border-border-soft px-3 py-2">
              <p className="m-0 text-xs text-muted-text">{t("broadcasts.preview.from")}</p>
              <p className="m-0 break-words text-sm font-semibold text-ink">{title}</p>
            </div>
            <p className="m-0 whitespace-pre-wrap break-words px-3 py-3 text-sm text-body">
              {text}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
