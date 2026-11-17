import { request } from "@/shared/api/client";

export interface MissingAccount {
  customerId: string;
  customerName: string;
  /** The API does not return phone numbers for this list. */
  phone: string;
  /** The API does not say whether an account is already queued. */
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
  accounts: { user_id: string; user_name: string }[];
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

export async function listMissingAccounts(): Promise<MissingAccount[]> {
  const result = await request<MissingList>(`${BASE}/missing-accounts`, { query: { limit: 100 } });
  return result.accounts.map((account) => ({
    customerId: account.user_id,
    customerName: account.user_name,
    phone: "",
    queued: null,
  }));
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
