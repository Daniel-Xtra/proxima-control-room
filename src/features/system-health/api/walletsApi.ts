import { request } from "@/shared/api/client";

export type Readiness = "ready" | "awaiting_kyc";

export interface WalletWithoutNumber {
  walletId: number;
  customerId: string;
  customerName: string;
  phone: string | null;
  kycLevel: number;
  /** KYC is far enough along that the account number should already exist. */
  ready: boolean;
  /** An account number record was started but holds no number. */
  incomplete: boolean;
  /** An admin asked for the number a short while ago, so the server will not accept another request yet. */
  recentlyRequested: boolean;
  walletCreatedAt: string;
}

export interface WalletFilters {
  readiness?: Readiness;
  search?: string;
  page: number;
  limit: number;
}

interface WalletRow {
  wallet_id: number;
  user_unique_identifier: string;
  name: string;
  phone_number: string | null;
  kyc_level: number;
  ready: boolean;
  has_incomplete_record: boolean;
  recently_requested: boolean;
  wallet_created_at: string;
}

/** Queues a request for the wallet's account number. Needs a fresh authenticator code first. */
export async function requestAccountNumber(walletId: number, reason: string) {
  await request<unknown>(`/admin/system/retail-wallets/${walletId}/account-number-request`, {
    method: "POST",
    body: { reason },
  });
}

export async function listWalletsWithoutNumber(filters: WalletFilters) {
  const result = await request<{
    data: WalletRow[];
    total: number;
    counts: { missing: number; ready: number; awaiting_kyc: number };
  }>("/admin/system/retail-wallets/missing-account-number", { query: { ...filters } });
  const rows: WalletWithoutNumber[] = result.data.map((row) => ({
    walletId: row.wallet_id,
    customerId: row.user_unique_identifier,
    customerName: row.name,
    // The server masks the number before sending it.
    phone: row.phone_number,
    kycLevel: row.kyc_level,
    ready: row.ready,
    incomplete: row.has_incomplete_record,
    recentlyRequested: row.recently_requested,
    walletCreatedAt: row.wallet_created_at,
  }));
  return {
    rows,
    total: result.total,
    counts: {
      missing: result.counts.missing,
      ready: result.counts.ready,
      awaitingKyc: result.counts.awaiting_kyc,
    },
  };
}
