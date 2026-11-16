import { recordAudit } from "@/shared/api/auditStore";
import { ApiError, paginate, simulate, type Page } from "@/shared/api/client";
import { onDomainEvent } from "@/shared/api/domainEvents";
import { compareValues } from "@/shared/components/tableSort";
import { FIXTURE_CUSTOMERS, daysAgo, seeded } from "@/shared/api/mockFixtures";
import type {
  ComplianceStatus,
  Customer,
  CustomerFilters,
  CustomerRow,
  CustomerStatus,
  KycLevel,
} from "../model/types";

const STATUSES: CustomerStatus[] = [
  "active",
  "active",
  "active",
  "active",
  "locked",
  "frozen",
  "deactivated",
];

const store = new Map<string, Customer>();

function build(index: number): Customer {
  const base = FIXTURE_CUSTOMERS[index]!;
  const rand = seeded(5000 + index);
  const kycLevel = (index % 7 === 0 ? 0 : index % 3 === 0 ? 1 : 2) as KycLevel;
  const status = STATUSES[index % STATUSES.length]!;
  const dailyLimitKobo = [5_000_000, 20_000_000, 100_000_000][kycLevel] ?? 5_000_000;
  const kycStatus: ComplianceStatus = kycLevel === 0 ? "pending" : "approved";
  const failed = status === "locked" ? 5 : index % 4 === 0 ? 2 : 0;
  return {
    ...base,
    dateOfBirth: `199${index % 10}-0${(index % 9) + 1}-1${index % 9}`,
    gender: (["male", "female", "unspecified"] as const)[index % 3]!,
    referralCode: `PRX${(7000 + index * 13).toString(36).toUpperCase()}`,
    joinedAt: daysAgo(index * 4 + 3),
    kycLevel,
    status,
    reservedAccount: `99${String(Math.floor(rand() * 90_000_000) + 10_000_000)}`,
    balanceKobo: Math.floor(rand() * 900_000_00) + 10_000,
    ledgerBalanceKobo: Math.floor(rand() * 900_000_00) + 10_000,
    moneyInKobo: Math.floor(rand() * 5_000_000_00),
    moneyOutKobo: Math.floor(rand() * 4_800_000_00),
    dailyLimitKobo,
    perTransactionLimitKobo: Math.round(dailyLimitKobo / 2),
    dailyUsedKobo: Math.floor(rand() * dailyLimitKobo),
    phoneVerified: true,
    emailVerified: index % 5 !== 0,
    pinSet: index % 6 !== 0,
    addressSet: index % 4 !== 0,
    pinLocked: index % 11 === 0,
    hasMerchantAccount: index % 9 === 0,
    loginLock: {
      failedAttempts: failed,
      remainingAttempts: Math.max(0, 5 - failed),
      lockedUntil: status === "locked" ? "2026-11-15T14:30:00.000Z" : null,
    },
    compliances: [
      {
        id: `${base.id}-nin`,
        type: "NIN",
        status: kycLevel >= 1 ? "approved" : "pending",
        value: String(Math.floor(rand() * 90_000_000_000) + 10_000_000_000),
        approvedAt: kycLevel >= 1 ? daysAgo(index * 4) : null,
        documents: ["nin-slip.pdf"],
      },
      {
        id: `${base.id}-bvn`,
        type: "BVN",
        status: kycLevel === 2 ? "approved" : index % 2 ? "rejected" : "draft",
        value: String(Math.floor(rand() * 90_000_000_000) + 10_000_000_000),
        approvedAt: kycLevel === 2 ? daysAgo(index * 4) : null,
        documents: [],
      },
      {
        id: `${base.id}-live`,
        type: "LIVELINESS",
        status: kycStatus,
        value: "liveliness-image.jpg",
        approvedAt: kycLevel >= 1 ? daysAgo(index * 4) : null,
        documents: ["liveliness-image.jpg"],
      },
    ],
    freezeHistory:
      status === "frozen"
        ? [
            {
              id: `${base.id}-f1`,
              kind: "freeze",
              at: daysAgo(2),
              by: "Tolu Adebayo",
              reason: "Suspected account takeover",
            },
          ]
        : [],
  };
}

function ensure() {
  if (store.size === 0)
    FIXTURE_CUSTOMERS.forEach((_, i) => {
      const customer = build(i);
      store.set(customer.id, customer);
    });
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };

export function listCustomers(filters: CustomerFilters): Promise<Page<CustomerRow>> {
  return simulate(() => {
    ensure();
    const needle = filters.search.trim().toLowerCase();
    const days = RANGE_DAYS[filters.range];
    const cutoff = days ? new Date(daysAgo(days)).getTime() : 0;
    const rows = [...store.values()]
      .filter((c) => !needle || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(needle))
      .filter((c) => filters.status === "all" || c.status === filters.status)
      .filter((c) => filters.kyc === "all" || String(c.kycLevel) === filters.kyc)
      .filter((c) => new Date(c.joinedAt).getTime() >= cutoff)
      .map<CustomerRow>((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        reservedAccount: c.reservedAccount,
        dailyLimitKobo: c.dailyLimitKobo,
        kycLevel: c.kycLevel,
        status: c.status,
        joinedAt: c.joinedAt,
      }));
    const sorter = SORTERS[filters.sort];
    if (sorter) {
      const factor = filters.dir === "desc" ? -1 : 1;
      rows.sort((a, b) => factor * compareValues(sorter(a), sorter(b)));
    }
    return paginate(rows, filters.page, filters.limit);
  });
}

/** Sortable columns, keyed as the table sends them. */
const SORTERS: Record<string, (row: CustomerRow) => string | number> = {
  name: (row) => row.name,
  limit: (row) => row.dailyLimitKobo,
  kyc: (row) => row.kycLevel,
  status: (row) => row.status,
  joined: (row) => row.joinedAt,
};

export function getCustomer(id: string): Promise<Customer> {
  return simulate(() => {
    ensure();
    const customer = store.get(id);
    if (!customer) throw new ApiError(404, "Customer not found.");
    return customer;
  });
}

function mutate(id: string, apply: (customer: Customer) => void) {
  ensure();
  const customer = store.get(id);
  if (!customer) throw new ApiError(404, "Customer not found.");
  apply(customer);
}

export function resetCustomerPassword(id: string, reason: string) {
  return simulate(() => {
    mutate(id, (c) => {
      recordAudit({ action: "customer.password.reset", target: c.name, reason });
    });
  });
}

export function unlockCustomerLogin(id: string, reason: string) {
  return simulate(() => {
    mutate(id, (c) => {
      const before = `${c.loginLock.failedAttempts} failed attempts`;
      c.loginLock = { failedAttempts: 0, remainingAttempts: 5, lockedUntil: null };
      if (c.status === "locked") c.status = "active";
      recordAudit({
        action: "customer.login.unlock",
        target: c.name,
        reason,
        before,
        after: "0 failed attempts",
      });
    });
  });
}

export function repairBankOneCustomer(id: string, reason: string) {
  return simulate(() => {
    let created = false;
    mutate(id, (c) => {
      created = c.id.endsWith("1");
      recordAudit({ action: "bankone.repair", target: c.name, reason });
    });
    return { customerCreated: created, accountFound: true };
  }, 700);
}

// Approved requests elsewhere in the console change the customer record.
onDomainEvent((event) => {
  ensure();
  const customer = store.get(event.customerId);
  if (!customer) return;
  if (event.type === "limits.changed") {
    customer.dailyLimitKobo = event.dailyLimitKobo;
    customer.perTransactionLimitKobo = event.perTransactionLimitKobo;
    return;
  }
  const frozen = event.type === "account.frozen";
  customer.status = frozen ? "frozen" : "active";
  customer.freezeHistory.unshift({
    id: crypto.randomUUID(),
    kind: frozen ? "freeze" : "unfreeze",
    at: new Date().toISOString(),
    by: event.by,
    reason: event.reason,
  });
});
