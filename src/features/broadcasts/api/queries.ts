import { useApiQuery } from "@/shared/hooks/useApiQuery";
import type { BroadcastFilters, SegmentFilters, TemplateFilters } from "../model/types";
import { getBroadcast, listBroadcasts, listTemplates } from "./broadcastsApi";
import { listSegments } from "./segmentsApi";

export const broadcastKeys = {
  all: ["broadcasts"] as const,
  list: (filters: BroadcastFilters) => ["broadcasts", "list", filters] as const,
  detail: (id: string) => ["broadcasts", "detail", id] as const,
  templates: (filters: TemplateFilters) => ["broadcasts", "templates", filters] as const,
  segments: (filters: SegmentFilters) => ["broadcasts", "segments", filters] as const,
};

export const useBroadcasts = (filters: BroadcastFilters) =>
  useApiQuery(broadcastKeys.list(filters), () => listBroadcasts(filters));

export const useBroadcast = (id: string) =>
  useApiQuery(broadcastKeys.detail(id), () => getBroadcast(id));

export const useTemplates = (filters: TemplateFilters) =>
  useApiQuery(broadcastKeys.templates(filters), () => listTemplates(filters));

export const useSegments = (filters: SegmentFilters) =>
  useApiQuery(broadcastKeys.segments(filters), () => listSegments(filters));
