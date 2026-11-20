import { request } from "@/shared/api/client";
import { t } from "@/shared/i18n/t";
import { ALL_SEGMENT_ID } from "../model/types";
import { rulesToApi, type ApiRules } from "../model/audience";
import type {
  Broadcast,
  BroadcastDraft,
  BroadcastFilters,
  BroadcastRow,
  BroadcastStatus,
  BroadcastTemplate,
  Channel,
  DeliveryRecord,
  DeliveryStatus,
  TemplateDraft,
  TemplateFilters,
} from "../model/types";

interface BroadcastView {
  id: string;
  name: string;
  channel: Channel;
  title: string | null;
  status: BroadcastStatus;
  audience_size: number;
  segment_id: string | null;
  scheduled_for: string | null;
  created_by_name: string | null;
  decided_by_name: string | null;
  decision_reason: string | null;
  started_at: string | null;
  failure: string | null;
  created_at: string;
  body?: string;
  delivery_counts?: { queued: number; failed: number; skipped: number };
}

interface DeliveryRow {
  id: number | string;
  customer_name: string | null;
  customer_id: string;
  status: DeliveryStatus;
  error: string | null;
}

function toRow(view: BroadcastView, segmentNames: Map<string, string>): BroadcastRow {
  return {
    id: view.id,
    name: view.name,
    channel: view.channel,
    subject: view.title ?? "",
    body: view.body ?? "",
    segmentId: view.segment_id ?? ALL_SEGMENT_ID,
    // Saved segments are named; anything else was sent to a custom set of rules.
    segmentName: view.segment_id
      ? (segmentNames.get(view.segment_id) ?? "")
      : t("segments.rule.everyone"),
    recipientCount: view.audience_size,
    status: view.status,
    ...(view.scheduled_for ? { scheduledFor: view.scheduled_for } : {}),
    createdBy: view.created_by_name ?? "",
    createdAt: view.created_at,
    // The API does not send the reason a broadcast was raised with.
    reason: "",
    ...(view.decided_by_name ? { decidedBy: view.decided_by_name } : {}),
    ...(view.started_at ? { decidedAt: view.started_at } : {}),
    ...(view.decision_reason ? { decisionComment: view.decision_reason } : {}),
    delivered: view.delivery_counts?.queued ?? 0,
    failed: view.delivery_counts?.failed ?? 0,
  };
}

async function segmentNames(): Promise<Map<string, string>> {
  const segments = await request<{ id: string; name: string }[]>("/admin/audience-segments");
  return new Map(segments.map((segment) => [segment.id, segment.name]));
}

export async function listBroadcasts(filters: BroadcastFilters): Promise<BroadcastRow[]> {
  const [page, names] = await Promise.all([
    request<{ data: BroadcastView[] }>("/admin/broadcasts", {
      query: {
        status: filters.status === "all" ? undefined : filters.status,
        channel: filters.channel === "all" ? undefined : filters.channel,
        limit: 100,
      },
    }),
    segmentNames(),
  ]);
  const needle = filters.search.trim().toLowerCase();
  return page.data
    .map((view) => toRow(view, names))
    .filter((row) => !needle || `${row.name} ${row.createdBy}`.toLowerCase().includes(needle));
}

export async function getBroadcast(id: string): Promise<Broadcast> {
  const [view, deliveries, names] = await Promise.all([
    request<BroadcastView>(`/admin/broadcasts/${encodeURIComponent(id)}`),
    request<{ data: DeliveryRow[] }>(`/admin/broadcasts/${encodeURIComponent(id)}/deliveries`, {
      query: { limit: 100 },
    }),
    segmentNames(),
  ]);
  const log: DeliveryRecord[] = deliveries.data.map((row) => ({
    id: String(row.id),
    recipient: row.customer_name ?? row.customer_id,
    status: row.status,
    ...(row.error ? { reason: row.error } : {}),
  }));
  return { ...toRow(view, names), log };
}

export interface NewBroadcastInput {
  draft: BroadcastDraft;
  reason: string;
}

export async function createBroadcast(
  draft: BroadcastDraft,
  reason: string,
  _templateId?: string,
): Promise<Broadcast> {
  const everyone = draft.segmentId === ALL_SEGMENT_ID;
  const created = await request<BroadcastView>("/admin/broadcasts", {
    method: "POST",
    body: {
      name: draft.name.trim(),
      channel: draft.channel,
      title: draft.channel === "sms" ? undefined : draft.subject.trim(),
      body: draft.body.trim(),
      ...(everyone ? { audience_rules: {} satisfies ApiRules } : { segment_id: draft.segmentId }),
      ...(draft.timing === "scheduled" && draft.when
        ? { scheduled_for: new Date(draft.when).toISOString() }
        : {}),
      reason,
    },
  });
  return { ...toRow(created, new Map()), log: [] };
}

export async function decideBroadcast(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<Broadcast> {
  const path = input.decision === "approved" ? "approve" : "reject";
  await request(`/admin/broadcasts/${encodeURIComponent(input.id)}/${path}`, {
    method: "POST",
    ...(input.decision === "rejected" ? { body: { reason: input.comment } } : {}),
  });
  return getBroadcast(input.id);
}

interface TemplateRow {
  id: string;
  name: string;
  channel: Channel;
  title: string | null;
  body: string;
  updated_at: string;
}

const toTemplate = (row: TemplateRow): BroadcastTemplate => ({
  id: row.id,
  name: row.name,
  channel: row.channel,
  subject: row.title ?? "",
  body: row.body,
  updatedAt: row.updated_at,
});

export async function listTemplates(filters: TemplateFilters): Promise<BroadcastTemplate[]> {
  const rows = await request<TemplateRow[]>("/admin/broadcast-templates", {
    query: { channel: filters.channel === "all" ? undefined : filters.channel },
  });
  const needle = filters.search.trim().toLowerCase();
  return rows
    .map(toTemplate)
    .filter((row) => !needle || `${row.name} ${row.body}`.toLowerCase().includes(needle));
}

/** Templates cannot change channel once created. */
export async function saveTemplate(
  draft: TemplateDraft,
  id: string | null,
  _reason: string,
): Promise<BroadcastTemplate> {
  const title = draft.channel === "sms" ? undefined : draft.subject.trim();
  const row = id
    ? await request<TemplateRow>(`/admin/broadcast-templates/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: { name: draft.name.trim(), title, body: draft.body.trim() },
      })
    : await request<TemplateRow>("/admin/broadcast-templates", {
        method: "POST",
        body: {
          name: draft.name.trim(),
          channel: draft.channel,
          title,
          body: draft.body.trim(),
        },
      });
  return toTemplate(row);
}

export async function deleteTemplate(id: string, _reason: string): Promise<void> {
  await request(`/admin/broadcast-templates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export { rulesToApi };
