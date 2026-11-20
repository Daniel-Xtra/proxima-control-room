import { request } from "@/shared/api/client";
import { t } from "@/shared/i18n/t";
import { rulesFromApi, rulesToApi, type ApiRules } from "../model/audience";
import {
  ALL_SEGMENT_ID,
  EMPTY_RULES,
  type AudienceRules,
  type AudienceSegment,
  type SegmentDraft,
  type SegmentFilters,
} from "../model/types";

interface SegmentRow {
  id: string;
  name: string;
  description: string | null;
  rules: ApiRules;
  updated_at: string;
}

/** How many customers the rules would reach right now. */
export async function estimateAudience(rules: AudienceRules): Promise<number> {
  const result = await request<{ estimated_size: number }>("/admin/audience-segments/estimate", {
    method: "POST",
    body: { rules: rulesToApi(rules) },
  });
  return result.estimated_size;
}

export async function listSegments(filters: SegmentFilters): Promise<AudienceSegment[]> {
  const rows = await request<SegmentRow[]>("/admin/audience-segments");
  const needle = filters.search.trim().toLowerCase();
  const saved = await Promise.all(
    rows
      .filter((row) => !needle || row.name.toLowerCase().includes(needle))
      .map(async (row): Promise<AudienceSegment> => {
        const rules = rulesFromApi(row.rules);
        return {
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          rules,
          builtIn: false,
          size: await estimateAudience(rules),
          updatedAt: row.updated_at,
        };
      }),
  );
  // "Every customer" is not stored: it is simply a broadcast with no rules.
  const everyone: AudienceSegment = {
    id: ALL_SEGMENT_ID,
    name: t("segments.rule.everyone"),
    description: "",
    rules: { ...EMPTY_RULES },
    builtIn: true,
    size: await estimateAudience(EMPTY_RULES),
    updatedAt: "",
  };
  return needle ? saved : [everyone, ...saved];
}

export async function saveSegment(
  draft: SegmentDraft,
  id: string | null,
  _reason: string,
): Promise<AudienceSegment> {
  const body = {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    rules: rulesToApi(draft.rules),
  };
  const row = id
    ? await request<SegmentRow>(`/admin/audience-segments/${encodeURIComponent(id)}`, {
        method: "PUT",
        body,
      })
    : await request<SegmentRow>("/admin/audience-segments", { method: "POST", body });
  const rules = rulesFromApi(row.rules);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    rules,
    builtIn: false,
    size: await estimateAudience(rules),
    updatedAt: row.updated_at,
  };
}

export async function deleteSegment(id: string, _reason: string): Promise<void> {
  await request(`/admin/audience-segments/${encodeURIComponent(id)}`, { method: "DELETE" });
}
