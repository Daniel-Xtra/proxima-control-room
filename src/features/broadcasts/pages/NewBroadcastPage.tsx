import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { TimingChoice } from "@/shared/components/TimingChoice";
import { Button } from "@/shared/components/ui/Button";
import { Radio } from "@/shared/components/ui/Checkbox";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { Textarea } from "@/shared/components/ui/Textarea";
import { t } from "@/shared/i18n/t";
import { formatCount, formatLagos } from "@/shared/lib/format";
import { createBroadcast } from "../api/broadcastsApi";
import { broadcastKeys, useSegments, useTemplates } from "../api/queries";
import { CHANNEL_ICONS } from "../components/BroadcastBadges";
import { MessagePreview } from "../components/MessagePreview";
import { bodyLimit, draftProblems, smsSegments, subjectLimit, usesSubject } from "../model/message";
import {
  CHANNELS,
  EMPTY_BROADCAST,
  LARGE_AUDIENCE,
  type BroadcastDraft,
  type Channel,
} from "../model/types";
import { describeRules } from "../model/audience";

export function NewBroadcastPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<BroadcastDraft>(EMPTY_BROADCAST);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string>();
  // Fixed when the page opens, so the allowed scheduling window does not shift while you type.
  const [now] = useState(() => new Date());
  const segments = useSegments({ search: "" });
  const segment = segments.data?.find((item) => item.id === draft.segmentId);

  const update = (patch: Partial<BroadcastDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const problems = draftProblems(draft, now);
  const recipients = segment?.size ?? 0;
  const when = draft.timing === "scheduled" && draft.when ? new Date(draft.when) : null;
  const hasSubject = usesSubject(draft.channel);

  // Only templates written for the chosen channel are offered.
  const templates = useTemplates({ search: "", channel: draft.channel });
  const [templateId, setTemplateId] = useState<string>();

  function applyTemplate(id: string) {
    const template = templates.data?.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(template.id);
    update({
      subject: draft.channel === "sms" ? "" : template.subject,
      body: template.body,
      name: draft.name || template.name,
    });
  }

  return (
    <>
      <PageHeader
        title={t("broadcasts.new")}
        description={t("broadcasts.new.description")}
        crumbs={[
          { label: t("nav.group.content") },
          { label: t("broadcasts.title"), to: "/content/broadcasts" },
          { label: t("broadcasts.new") },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/content/broadcasts")}>
              {t("common.cancel")}
            </Button>
            <Button disabled={problems.length > 0 || !segment} onClick={() => setConfirmOpen(true)}>
              {t("broadcasts.submit")}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <SectionCard title={t("broadcasts.section.message")}>
            <div className="flex flex-col gap-4">
              <fieldset className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-3">
                <legend className="mb-1 text-xs font-medium text-ink">
                  {t("broadcasts.field.channel")}
                </legend>
                {CHANNELS.map((channel: Channel) => {
                  const Glyph = CHANNEL_ICONS[channel];
                  return (
                    <div
                      key={channel}
                      className="card flex gap-3 p-3 has-[input:checked]:border-ink has-[input:checked]:bg-surface-muted"
                    >
                      <Radio
                        id={`channel-${channel}`}
                        name="channel"
                        checked={draft.channel === channel}
                        onChange={() =>
                          update({ channel, subject: channel === "sms" ? "" : draft.subject })
                        }
                      />
                      <div>
                        <Label
                          htmlFor={`channel-${channel}`}
                          className="cursor-pointer text-sm font-semibold text-ink"
                        >
                          <Glyph aria-hidden="true" size={16} />
                          {t(`broadcasts.channel.${channel}`)}
                        </Label>
                        <p className="m-0 mt-0.5 text-xs text-muted-text">
                          {t(`broadcasts.channel.${channel}.desc`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bc-name">{t("broadcasts.field.name")}</Label>
                  <Input
                    id="bc-name"
                    className="mt-1"
                    value={draft.name}
                    placeholder={t("broadcasts.field.namePlaceholder")}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bc-template">{t("broadcasts.field.template")}</Label>
                  <Select
                    value=""
                    onValueChange={applyTemplate}
                    disabled={!templates.data || templates.data.length === 0}
                  >
                    <SelectTrigger id="bc-template" className="mt-1 h-[52px]">
                      <SelectValue
                        placeholder={
                          templates.data && templates.data.length === 0
                            ? t("broadcasts.field.templateNone")
                            : t("broadcasts.field.templatePlaceholder")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.data?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="m-0 mt-1 text-xs text-muted-text">
                    <Link
                      to="/content/broadcast-templates"
                      className="text-blue-strong hover:underline"
                    >
                      {t("broadcasts.field.manageTemplates")}
                    </Link>
                  </p>
                </div>
              </div>

              {hasSubject ? (
                <div>
                  <Label htmlFor="bc-subject">
                    {draft.channel === "push"
                      ? t("broadcasts.field.pushTitle")
                      : t("broadcasts.field.subject")}
                  </Label>
                  <Input
                    id="bc-subject"
                    className="mt-1"
                    maxLength={subjectLimit(draft.channel)}
                    value={draft.subject}
                    onChange={(e) => update({ subject: e.target.value })}
                  />
                  <p className="m-0 mt-1 text-right text-xs text-muted-text">
                    {draft.subject.length}/{subjectLimit(draft.channel)}
                  </p>
                </div>
              ) : null}

              <div>
                <Label htmlFor="bc-body">{t("broadcasts.field.body")}</Label>
                <Textarea
                  id="bc-body"
                  className="mt-1 min-h-32"
                  maxLength={bodyLimit(draft.channel)}
                  value={draft.body}
                  onChange={(e) => update({ body: e.target.value })}
                  aria-describedby="bc-body-help"
                />
                <p
                  id="bc-body-help"
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
            </div>
          </SectionCard>

          <SectionCard
            title={t("broadcasts.section.audience")}
            description={t("broadcasts.section.audienceHint")}
          >
            <div className="max-w-md">
              <Label htmlFor="bc-segment">{t("broadcasts.field.segment")}</Label>
              <Select value={draft.segmentId} onValueChange={(v) => update({ segmentId: v })}>
                <SelectTrigger id="bc-segment" className="mt-1 h-[52px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.data?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {formatCount(item.size)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="m-0 mt-2 flex items-baseline gap-2 text-sm text-muted-text">
                {t("broadcasts.audience.estimate")}
                {segment === undefined ? (
                  <Skeleton className="inline-block h-4 w-16 align-middle" />
                ) : (
                  <span className="font-semibold text-ink">{formatCount(segment.size)}</span>
                )}
              </p>
              {segment ? (
                <p className="m-0 mt-1 text-xs text-muted-text">{describeRules(segment.rules)}</p>
              ) : null}
              <p className="m-0 mt-1 text-xs">
                <Link to="/content/audience-segments" className="text-blue-strong hover:underline">
                  {t("broadcasts.field.manageSegments")}
                </Link>
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title={t("broadcasts.section.when")}
            description={t("broadcasts.section.whenHint")}
          >
            <TimingChoice
              timing={draft.timing}
              when={draft.when}
              onTimingChange={(timing) => update({ timing })}
              onWhenChange={(value) => update({ when: value })}
              now={now}
              labels={{
                now: t("broadcasts.timing.now"),
                nowDescription: t("broadcasts.timing.now.desc"),
                schedule: t("broadcasts.timing.schedule"),
                scheduleDescription: t("broadcasts.timing.schedule.desc"),
                at: t("broadcasts.timing.at"),
                help: t("broadcasts.timing.help"),
                legend: t("broadcasts.section.when"),
              }}
            />
          </SectionCard>
        </div>

        <aside
          aria-label={t("broadcasts.preview.title")}
          className="flex flex-col gap-4 lg:sticky lg:top-20"
        >
          <MessagePreview channel={draft.channel} subject={draft.subject} body={draft.body} />
          <SectionCard title={t("broadcasts.summary.title")}>
            <dl className="m-0 divide-y divide-border-soft text-sm">
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="text-muted-text">{t("broadcasts.field.channel")}</dt>
                <dd className="m-0 text-ink">{t(`broadcasts.channel.${draft.channel}`)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="text-muted-text">{t("broadcasts.field.segment")}</dt>
                <dd className="m-0 text-right text-ink">{segment?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="text-muted-text">{t("broadcasts.col.recipients")}</dt>
                <dd className="m-0 text-ink">{formatCount(recipients)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1.5">
                <dt className="text-muted-text">{t("broadcasts.col.sends")}</dt>
                <dd className="m-0 text-right text-ink">
                  {when ? formatLagos(when.toISOString()) : t("broadcasts.timing.onApproval")}
                </dd>
              </div>
              {draft.channel === "sms" ? (
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-muted-text">{t("broadcasts.summary.cost")}</dt>
                  <dd className="m-0 text-ink">
                    <MoneyText kobo={recipients * smsSegments(draft.body.length) * 400} />
                  </dd>
                </div>
              ) : null}
            </dl>
            {problems.length > 0 ? (
              <ul className="m-0 mt-3 list-disc pl-4 text-xs text-danger-text">
                {problems.map((problem) => (
                  <li key={problem}>{t(problem)}</li>
                ))}
              </ul>
            ) : null}
          </SectionCard>
        </aside>
      </div>

      <ActionDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && createdId) navigate(`/content/broadcasts/${createdId}`);
        }}
        title={t("broadcasts.submit.title")}
        description={draft.name}
        impact={
          when
            ? t("broadcasts.submit.impactScheduled", {
                count: formatCount(recipients),
                when: formatLagos(when.toISOString()),
              })
            : t("broadcasts.submit.impact", { count: formatCount(recipients) })
        }
        confirmLabel={t("broadcasts.submit")}
        typedConfirmation={recipients > LARGE_AUDIENCE}
        onConfirm={async ({ reason }) => {
          const created = await createBroadcast(draft, reason, templateId);
          setCreatedId(created.id);
          await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
          return t("broadcasts.submit.done");
        }}
      />
    </>
  );
}
