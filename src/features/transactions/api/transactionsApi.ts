import { recordAudit } from "@/shared/api/auditStore";
import { ApiError, paginate, simulate, type Page } from "@/shared/api/client";
import { compareValues } from "@/shared/components/tableSort";
import { FIXTURE_CUSTOMERS, daysAgo, seeded } from "@/shared/api/mockFixtures";
import {
  TRANSACTION_PURPOSES,
  type Transaction,
  type TransactionDirection,
  type TransactionFilters,
  type TransactionStatus,
} from "../model/types";

let store: Transaction[] | null = null;

const PROVIDER_RESPONSES: Record<TransactionStatus, string> = {
  success: '{"responseCode":"00","responseMessage":"Approved or completed successfully"}',
  failed: '{"responseCode":"91","responseMessage":"Issuer or switch inoperative"}',
  pending: '{"responseCode":"09","responseMessage":"Request in progress"}',
};

function build(): Transaction[] {
  const rand = seeded(777);
  return Array.from({ length: 240 }, (_, index) => {
    const customer = FIXTURE_CUSTOMERS[Math.floor(rand() * FIXTURE_CUSTOMERS.length)]!;
    const purpose = TRANSACTION_PURPOSES[Math.floor(rand() * 7)]!;
    const roll = rand();
    const status: TransactionStatus = roll < 0.78 ? "success" : roll < 0.9 ? "failed" : "pending";
    const direction: TransactionDirection =
      purpose === "reserved_account_funding" || purpose === "reversal" ? "credit" : "debit";
    const amountKobo = Math.round((rand() * 480_000 + 500) * 100);
    const before = Math.round(rand() * 900_000 * 100) + amountKobo;
    const after =
      status !== "success"
        ? before
        : direction === "credit"
          ? before + amountKobo
          : before - amountKobo;
    return {
      reference: `PRX${(1_000_000 + index * 37).toString(36).toUpperCase()}${index.toString().padStart(4, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      direction,
      purpose,
      amountKobo,
      status,
      balanceBeforeKobo: before,
      balanceAfterKobo: after,
      narration: `${purpose.replace(/_/g, " ")} ${direction === "credit" ? "from" : "to"} ${FIXTURE_CUSTOMERS[(index * 7) % FIXTURE_CUSTOMERS.length]!.name}`,
      metadata: {
        channel: "mobile",
        session: `SES${index * 91}`,
        fee: purpose === "bank_transfer" ? 5000 : 0,
      },
      providerResponse: PROVIDER_RESPONSES[status],
      createdAt: daysAgo(Math.floor(rand() * 60), 6 + Math.floor(rand() * 14)),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function all(): Transaction[] {
  store ??= build();
  return store;
}

/** Sortable columns, keyed as the table sends them. */
const SORTERS: Record<string, (tx: Transaction) => string | number> = {
  reference: (tx) => tx.reference,
  customer: (tx) => tx.customerName,
  purpose: (tx) => tx.purpose,
  amount: (tx) => tx.amountKobo,
  status: (tx) => tx.status,
  date: (tx) => tx.createdAt,
};

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function listTransactions(filters: TransactionFilters): Promise<Page<Transaction>> {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    const days = RANGE_DAYS[filters.range];
    const cutoff = days ? new Date(daysAgo(days)).getTime() : 0;
    const rows = all()
      .filter((tx) => !filters.customerId || tx.customerId === filters.customerId)
      .filter((tx) => filters.status === "all" || tx.status === filters.status)
      .filter((tx) => filters.purpose === "all" || tx.purpose === filters.purpose)
      .filter((tx) => new Date(tx.createdAt).getTime() >= cutoff)
      .filter(
        (tx) => !needle || `${tx.reference} ${tx.customerName}`.toLowerCase().includes(needle),
      );
    const sorter = SORTERS[filters.sort];
    if (sorter) {
      const factor = filters.dir === "desc" ? -1 : 1;
      rows.sort((a, b) => factor * compareValues(sorter(a), sorter(b)));
    }
    return paginate(rows, filters.page, filters.limit);
  });
}

export function requeryTransaction(reference: string, reason: string) {
  return simulate(() => {
    const tx = all().find((candidate) => candidate.reference === reference);
    if (!tx) throw new ApiError(404, "Transaction not found.");
    if (tx.status !== "pending")
      throw new ApiError(409, "Only pending transactions can be requeried.");
    tx.status = "success";
    tx.providerResponse = PROVIDER_RESPONSES.success;
    recordAudit({
      action: "transaction.requery",
      target: reference,
      reason,
      before: "pending",
      after: "success",
    });
    return tx.status;
  }, 600);
}

export function reverseTransaction(reference: string, reason: string) {
  return simulate(() => {
    const tx = all().find((candidate) => candidate.reference === reference);
    if (!tx) throw new ApiError(404, "Transaction not found.");
    if (tx.status !== "success")
      throw new ApiError(409, "Only successful transactions can be reversed.");
    all().unshift({
      ...tx,
      reference: `${tx.reference}-RVSL`,
      purpose: "reversal",
      direction: tx.direction === "debit" ? "credit" : "debit",
      narration: `Reversal of ${tx.reference}`,
      createdAt: new Date().toISOString(),
    });
    recordAudit({ action: "transaction.reverse", target: reference, reason });
  }, 600);
}

export function requestStatement(input: {
  customerName: string;
  format: string;
  recipient: string;
  reason: string;
}) {
  return simulate(() => {
    recordAudit({
      action: "customer.statement.export",
      target: input.customerName,
      reason: input.reason,
      after: `${input.format} to ${input.recipient}`,
    });
  }, 600);
}
