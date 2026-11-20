import { request, type Page } from "@/shared/api/client";
import type { UpgradeRequest, UpgradeRequestFilters } from "../model/types";

interface QueueItem {
  unique_identifier: string;
  name: string;
  email: string;
  phone_number: string;
  current_tier: number;
  target_tier: number;
  status: UpgradeRequest["status"];
  documents: number;
  awaiting_documents: number;
  submitted_at: string;
}

interface QueuePage {
  data: QueueItem[];
  total: number;
  page: number;
  limit: number;
  /** Customers with at least one document waiting for a decision, whatever the filters say. */
  awaiting: number;
}

/** Customers who finished uploading documents, with where their tier-upgrade review stands. */
export async function listUpgradeRequests(
  filters: UpgradeRequestFilters,
): Promise<Page<UpgradeRequest> & { awaiting: number }> {
  const search = filters.search.trim();
  const result = await request<QueuePage>("/admin/customer-upgrade-requests", {
    query: {
      status: filters.status === "all" ? undefined : filters.status,
      // The server asks for 3 or more characters.
      search: search.length >= 3 ? search : undefined,
      page: filters.page,
      limit: filters.limit,
    },
  });
  return {
    items: result.data.map((item) => ({
      id: item.unique_identifier,
      name: item.name,
      email: item.email,
      phone: item.phone_number,
      currentTier: item.current_tier,
      targetTier: item.target_tier,
      status: item.status,
      documents: item.documents,
      awaitingDocuments: item.awaiting_documents,
      submittedAt: item.submitted_at,
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    awaiting: result.awaiting,
  };
}

/** How many customers are waiting for a decision, for the badge on the tab. */
export async function countAwaitingUpgrades(): Promise<number> {
  const result = await request<QueuePage>("/admin/customer-upgrade-requests", {
    query: { limit: 1 },
  });
  return result.awaiting;
}
