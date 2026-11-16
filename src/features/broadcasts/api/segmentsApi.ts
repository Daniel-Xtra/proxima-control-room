import { getAuditActor, recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { estimateSize, segmentProblems } from "../model/audience";
import type { AudienceSegment, SegmentDraft, SegmentFilters } from "../model/types";
import { broadcastUsage } from "./broadcastsApi";
import { allSegments, findSegment, replaceSegments, type StoredSegment } from "./segmentsStore";

function toSegment(stored: StoredSegment): AudienceSegment {
  return {
    ...stored,
    rules: { ...stored.rules },
    size: estimateSize(stored.rules),
    broadcastCount: broadcastUsage()[stored.id]?.total ?? 0,
  };
}

export function listSegments(filters: SegmentFilters): Promise<AudienceSegment[]> {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    return allSegments()
      .filter((s) => !needle || `${s.name} ${s.description}`.toLowerCase().includes(needle))
      .map(toSegment)
      .sort((a, b) => Number(b.builtIn) - Number(a.builtIn) || a.name.localeCompare(b.name));
  });
}

function nameTaken(name: string, exceptId: string | null): boolean {
  const wanted = name.trim().toLowerCase();
  return allSegments().some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === wanted);
}

export function saveSegment(
  draft: SegmentDraft,
  id: string | null,
  reason: string,
): Promise<AudienceSegment> {
  return simulate(() => {
    const existing = id ? findSegment(id) : undefined;
    if (id && !existing) throw new ApiError(404, "Segment not found.");
    if (existing?.builtIn) throw new ApiError(403, "The built-in segment cannot be changed.");
    if (segmentProblems(draft).length > 0)
      throw new ApiError(422, "Fix the segment before saving it.");
    if (nameTaken(draft.name, id))
      throw new ApiError(409, "Another segment already has that name.");

    const fields = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      rules: { ...draft.rules },
      updatedBy: getAuditActor(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      Object.assign(existing, fields);
      recordAudit({ action: "audience_segment.update", target: existing.name, reason });
      return toSegment(existing);
    }
    const created: StoredSegment = { id: crypto.randomUUID(), builtIn: false, ...fields };
    allSegments().push(created);
    recordAudit({ action: "audience_segment.create", target: created.name, reason });
    return toSegment(created);
  });
}

export function deleteSegment(id: string, reason: string): Promise<void> {
  return simulate(() => {
    const existing = findSegment(id);
    if (!existing) throw new ApiError(404, "Segment not found.");
    if (existing.builtIn) throw new ApiError(403, "The built-in segment cannot be deleted.");
    const open = broadcastUsage()[id]?.open ?? 0;
    if (open > 0) {
      throw new ApiError(409, `${open} broadcast(s) waiting to be sent still use this segment.`);
    }
    replaceSegments(allSegments().filter((s) => s.id !== id));
    recordAudit({ action: "audience_segment.delete", target: existing.name, reason });
  });
}
