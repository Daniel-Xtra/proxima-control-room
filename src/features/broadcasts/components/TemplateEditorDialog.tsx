import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";
import { t } from "@/shared/i18n/t";
import { saveTemplate } from "../api/broadcastsApi";
import { broadcastKeys } from "../api/queries";
import {
  bodyLimit,
  contentProblems,
  smsSegments,
  subjectLimit,
  usesSubject,
} from "../model/message";
import { CHANNELS, type BroadcastTemplate, type Channel, type TemplateDraft } from "../model/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The template being edited, or `null` to create a new one. */
  template: BroadcastTemplate | null;
}

const BLANK: TemplateDraft = { name: "", channel: "push", subject: "", body: "" };

/** Mount with a `key` per template so the form starts from that template's values. */
export function TemplateEditorDialog({ open, onOpenChange, template }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<TemplateDraft>(
    template
      ? {
          name: template.name,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
        }
      : BLANK,
  );
  const update = (patch: Partial<TemplateDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const problems = contentProblems(draft);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={template ? t("templates.edit") : t("templates.new")}
      description={t("templates.editor.description")}
      confirmLabel={t("common.save")}
      requireTotp={false}
      requireReason={false}
      blocked={problems.length > 0}
      onConfirm={async () => {
        await saveTemplate(draft, template?.id ?? null, "");
        await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
        return t("templates.saved");
      }}
    >
      <div>
        <Label htmlFor="tpl-name">{t("templates.field.name")}</Label>
        <Input
          id="tpl-name"
          className="mt-1"
          value={draft.name}
          placeholder={t("templates.field.namePlaceholder")}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="tpl-channel">{t("broadcasts.field.channel")}</Label>
        <Select
          value={draft.channel}
          onValueChange={(value) =>
            update({
              channel: value as Channel,
              subject: value === "sms" ? "" : draft.subject,
            })
          }
        >
          <SelectTrigger id="tpl-channel" className="mt-1 data-[size=default]:h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNELS.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {t(`broadcasts.channel.${channel}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {usesSubject(draft.channel) ? (
        <div>
          <Label htmlFor="tpl-subject">
            {draft.channel === "push"
              ? t("broadcasts.field.pushTitle")
              : t("broadcasts.field.subject")}
          </Label>
          <Input
            id="tpl-subject"
            className="mt-1"
            maxLength={subjectLimit(draft.channel)}
            value={draft.subject}
            onChange={(e) => update({ subject: e.target.value })}
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="tpl-body">{t("broadcasts.field.body")}</Label>
        <Textarea
          id="tpl-body"
          className="mt-1 min-h-32"
          maxLength={bodyLimit(draft.channel)}
          value={draft.body}
          onChange={(e) => update({ body: e.target.value })}
          aria-describedby="tpl-body-help"
        />
        <p
          id="tpl-body-help"
          className="m-0 mt-1 flex justify-between gap-2 text-xs text-muted-text"
        >
          <span>{t("broadcasts.field.bodyHelp")}</span>
          <span className="tabular-nums">
            {draft.body.length}/{bodyLimit(draft.channel)}
            {draft.channel === "sms"
              ? ` · ${t("broadcasts.preview.segments", { count: smsSegments(draft.body.length) })}`
              : ""}
          </span>
        </p>
      </div>
      {draft.name !== "" && problems.length > 0 ? (
        <ul className="m-0 list-disc pl-4 text-xs text-danger-text">
          {problems.map((problem) => (
            <li key={problem}>{t(problem)}</li>
          ))}
        </ul>
      ) : null}
    </ActionDialog>
  );
}
