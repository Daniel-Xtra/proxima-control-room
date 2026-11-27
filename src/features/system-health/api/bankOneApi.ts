import { request } from "@/shared/api/client";

export interface MissingAccount {
  customerId: string;
  customerName: string;
  phone: string;
  /** Queued for repair in the last few hours. */
  queued: boolean | null;
}

export type RepairOutcome = "created" | "found" | "failed";
export interface RepairResult {
  customerId: string;
  customerName: string;
  outcome: RepairOutcome;
}

interface Statistics {
  total_accounts: number;
  accounts_missing_bankone_customers: number;
}

interface MissingList {
  total: number;
  accounts: {
    user_id: string;
    user_name: string;
    phone_number?: string | null;
    already_queued?: boolean;
  }[];
}

const BASE = "/admin/bankone-repair";

export async function getBankOneOverview() {
  const stats = await request<Statistics>(`${BASE}/statistics`);
  return {
    customersChecked: stats.total_accounts,
    missingAccounts: stats.accounts_missing_bankone_customers,
    queued: null as number | null,
  };
}

export async function listMissingAccounts({ page, limit }: { page: number; limit: number }) {
  const offset = (page - 1) * limit;
  const result = await request<MissingList>(`${BASE}/missing-accounts`, {
    query: { limit, offset },
  });
  // Older servers ignore the limit and send every account, so the page is cut here when that happens.
  const accounts =
    result.accounts.length > limit
      ? result.accounts.slice(offset, offset + limit)
      : result.accounts;
  const rows: MissingAccount[] = accounts.map((account) => ({
    customerId: account.user_id,
    customerName: account.user_name.replace(/undefined/g, "").trim() || "–",
    phone: account.phone_number ?? "",
    queued: account.already_queued ?? null,
  }));
  return { rows, total: result.total };
}

export async function runHealthCheck() {
  const started = performance.now();
  const health = await request<{ status: string }>(`${BASE}/health`);
  return {
    ok: health.status === "healthy",
    latencyMs: Math.round(performance.now() - started),
    checkedAt: new Date().toISOString(),
  };
}

interface AccountResult {
  user_id: string;
  user_name: string;
  status: "repaired" | "failed" | "already_exists" | "skipped";
}

const OUTCOME: Record<AccountResult["status"], RepairOutcome> = {
  repaired: "created",
  already_exists: "found",
  skipped: "found",
  failed: "failed",
};

export async function bulkRepair(dryRun: boolean, _reason: string): Promise<RepairResult[]> {
  const result = await request<{ accounts_processed: AccountResult[] }>(`${BASE}/repair/bulk`, {
    method: "POST",
    body: { dry_run: dryRun },
  });
  return result.accounts_processed.map((account) => ({
    customerId: account.user_id,
    customerName: account.user_name,
    outcome: OUTCOME[account.status],
  }));
}

export async function repairSingle(customerId: string, _reason: string): Promise<RepairResult> {
  const result = await request<{ success: boolean; customer_created: boolean }>(
    `${BASE}/repair/single`,
    { method: "POST", body: { user_unique_identifier: customerId } },
  );
  return {
    customerId,
    customerName: "",
    outcome: !result.success ? "failed" : result.customer_created ? "created" : "found",
  };
}
