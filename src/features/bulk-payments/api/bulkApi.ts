import { getAuditActor, recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { FIXTURE_CUSTOMERS, daysAgo, seeded } from "@/shared/api/mockFixtures";
import { isScheduleAllowed } from "../model/draft";
import {
  BANKS,
  FEE_PER_PAYEE_KOBO,
  MAX_SCHEDULE_DAYS,
  type SourceBalances,
  summarize,
  type BatchFilters,
  type BatchRow,
  type BatchStatus,
  type BulkBatch,
  type BulkItem,
  type PayeeDraft,
  type SourceAccount,
} from "../model/types";

const FAILURES = ["Account closed", "Beneficiary bank unavailable", "Account name mismatch"];

function seedItems(batchIndex: number, count: number, resolve: boolean): BulkItem[] {
  const rand = seeded(900 + batchIndex);
  return Array.from({ length: count }, (_, i) => {
    const payee = FIXTURE_CUSTOMERS[(batchIndex * 7 + i) % FIXTURE_CUSTOMERS.length]!;
    const failed = resolve && batchIndex === 2 && i % 5 === 3;
    return {
      id: `item-${batchIndex}-${i}`,
      row: i + 1,
      accountName: payee.name,
      accountNumber: String(Math.floor(rand() * 9_000_000_000) + 1_000_000_000),
      bank: BANKS[Math.floor(rand() * BANKS.length)]!,
      amountKobo: Math.round((rand() * 280_000 + 5_000) * 100),
      narration: "Batch payout",
      status: !resolve ? "pending" : failed ? "failed" : "success",
      failureReason: failed ? FAILURES[i % FAILURES.length] : undefined,
    };
  });
}

function seedBatch(
  index: number,
  name: string,
  status: BatchStatus,
  createdBy: string,
  count: number,
  days: number,
): BulkBatch {
  const decided = status !== "pending_approval";
  return {
    id: `00000000-0000-4000-8000-0007${index.toString(16).padStart(8, "0")}`,
    name,
    sourceAccount: index % 2 ? "float" : "settlement",
    createdBy,
    createdAt: daysAgo(days, 9),
    reason: "Scheduled payout approved by finance.",
    status,
    ...(decided
      ? {
          decidedBy: "Chuka Obi",
          decidedAt: daysAgo(days, 14),
          decisionComment: status === "rejected" ? "Total does not match the invoice." : "Checked.",
        }
      : {}),
    items: seedItems(index, count, status === "completed" || status === "partially_failed"),
  };
}

let store: BulkBatch[] | null = null;

function all(): BulkBatch[] {
  store ??= [
    seedBatch(1, "November vendor payouts", "pending_approval", "Tolu Adebayo", 24, 0),
    seedBatch(2, "Refund run, October", "partially_failed", "Ife Johnson", 18, 6),
    seedBatch(3, "Staff allowances, October", "completed", "Tolu Adebayo", 32, 14),
    seedBatch(4, "Cashback promotion", "rejected", "Ife Johnson", 12, 20),
    {
      ...seedBatch(5, "Supplier settlements", "pending_approval", "Amaka Eze", 9, 1),
      scheduledFor: daysAgo(-3, 8),
    },
  ];
  return store;
}

/** The float account is kept low on purpose, so an oversized batch shows the "not enough balance" state. */
const BALANCES: SourceBalances = {
  settlement: 4_825_000_000,
  float: 300_000_000,
};

export const getSourceBalances = (): Promise<SourceBalances> =>
  simulate(() => ({ ...BALANCES }), 250);

export function listBatches(filters: BatchFilters): Promise<BatchRow[]> {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    return all()
      .filter((b) => filters.status === "all" || b.status === filters.status)
      .filter((b) => !needle || `${b.name} ${b.createdBy}`.toLowerCase().includes(needle))
      .map(({ items, ...batch }) => ({ ...batch, ...summarize(items) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export function getBatch(id: string): Promise<BulkBatch> {
  return simulate(() => {
    const batch = all().find((b) => b.id === id);
    if (!batch) throw new ApiError(404, "Batch not found.");
    return { ...batch, items: batch.items.map((item) => ({ ...item })) };
  });
}

export interface NewBatch {
  name: string;
  sourceAccount: SourceAccount;
  payees: PayeeDraft[];
  reason: string;
  /** ISO time to pay at. Leave out to pay right after approval. */
  scheduledFor?: string;
}

export function createBatch(input: NewBatch): Promise<BulkBatch> {
  return simulate(() => {
    if (input.payees.length === 0 || input.payees.some((p) => p.errors.length > 0)) {
      throw new ApiError(422, "Fix or remove the invalid rows first.");
    }
    const debitKobo =
      input.payees.reduce((sum, p) => sum + (p.amountKobo ?? 0), 0) +
      input.payees.length * FEE_PER_PAYEE_KOBO;
    if (debitKobo > BALANCES[input.sourceAccount]) {
      throw new ApiError(422, "The account does not have enough balance for this batch.");
    }
    // The 30-day limit is enforced here as well, not only in the form.
    if (input.scheduledFor && !isScheduleAllowed(new Date(input.scheduledFor), new Date())) {
      throw new ApiError(
        422,
        `The payment time must be in the future and within ${MAX_SCHEDULE_DAYS} days.`,
      );
    }
    const batch: BulkBatch = {
      id: crypto.randomUUID(),
      name: input.name,
      sourceAccount: input.sourceAccount,
      createdBy: getAuditActor(),
      createdAt: new Date().toISOString(),
      reason: input.reason,
      scheduledFor: input.scheduledFor,
      status: "pending_approval",
      items: input.payees.map((p, i) => ({
        id: crypto.randomUUID(),
        row: i + 1,
        accountName: p.accountName,
        accountNumber: p.accountNumber,
        bank: p.bank,
        amountKobo: p.amountKobo ?? 0,
        narration: p.narration,
        status: "pending",
      })),
    };
    all().unshift(batch);
    recordAudit({
      action: "bulk_payment.submit",
      target: input.name,
      reason: input.reason,
      after: `${batch.items.length} payees`,
    });
    return batch;
  }, 600);
}

export function decideBatch(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<BulkBatch> {
  return simulate(() => {
    const batch = all().find((b) => b.id === input.id);
    if (!batch) throw new ApiError(404, "Batch not found.");
    if (batch.status !== "pending_approval") {
      throw new ApiError(409, "This batch has already been decided.");
    }
    const actor = getAuditActor();
    if (batch.createdBy === actor) {
      throw new ApiError(403, "You cannot decide a batch you created.");
    }
    batch.decidedBy = actor;
    batch.decidedAt = new Date().toISOString();
    batch.decisionComment = input.comment;
    if (input.decision === "rejected") {
      batch.status = "rejected";
    } else if (batch.scheduledFor && new Date(batch.scheduledFor).getTime() > Date.now()) {
      // Approved for a later date: payees stay waiting until the scheduled time.
      batch.status = "scheduled";
    } else {
      // Processing is simulated: every fourth payee fails so the retry path can be exercised.
      batch.items.forEach((item, i) => {
        const failed = i % 4 === 3;
        item.status = failed ? "failed" : "success";
        item.failureReason = failed ? FAILURES[i % FAILURES.length] : undefined;
      });
      batch.status = batch.items.some((i) => i.status === "failed")
        ? "partially_failed"
        : "completed";
    }
    recordAudit({
      action: `bulk_payment.${input.decision}`,
      target: batch.name,
      reason: input.comment,
      before: "pending_approval",
      after: batch.status,
    });
    return batch;
  }, 700);
}

export function retryFailed(id: string, reason: string): Promise<BulkBatch> {
  return simulate(() => {
    const batch = all().find((b) => b.id === id);
    if (!batch) throw new ApiError(404, "Batch not found.");
    if (batch.status !== "partially_failed") {
      throw new ApiError(409, "There are no failed payees to retry.");
    }
    batch.items.forEach((item) => {
      if (item.status === "failed") {
        item.status = "success";
        item.failureReason = undefined;
      }
    });
    batch.status = "completed";
    recordAudit({ action: "bulk_payment.retry", target: batch.name, reason });
    return batch;
  }, 700);
}
