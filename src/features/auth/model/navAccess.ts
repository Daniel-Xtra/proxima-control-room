import type { MessageKey } from "@/shared/i18n/t";
import type { Permission } from "./permissions";

export interface NavAccess {
  id: string;
  label: MessageKey;
  /** Visible when the user holds any of these. `null` means everyone signed in. */
  anyOf: Permission[] | null;
}

/** Single source for what each screen needs. The shell and the role preview both read it. */
export const NAV_ACCESS: NavAccess[] = [
  { id: "overview", label: "nav.overview", anyOf: null },
  { id: "customers", label: "nav.customers", anyOf: ["customer:view"] },
  { id: "transactions", label: "nav.transactions", anyOf: ["transaction:view"] },
  {
    id: "requests",
    label: "nav.requests",
    anyOf: [
      "request:view_all",
      "freeze_request:initiate",
      "unfreeze_request:initiate",
      "limit_request:initiate",
    ],
  },
  { id: "savings", label: "nav.savings", anyOf: ["savings:view"] },
  { id: "bulk-payments", label: "nav.bulkPayments", anyOf: ["bulk_payment:view"] },
  { id: "banners", label: "nav.banners", anyOf: ["content:view"] },
  { id: "broadcasts", label: "nav.broadcasts", anyOf: ["content:view"] },
  { id: "broadcast-templates", label: "nav.templates", anyOf: ["content:view"] },
  { id: "audience-segments", label: "nav.segments", anyOf: ["content:view"] },
  { id: "lock-policy", label: "nav.lockPolicy", anyOf: ["security_policy:edit"] },
  { id: "webhooks", label: "nav.webhooks", anyOf: ["integrations:view"] },
  { id: "audit", label: "nav.audit", anyOf: ["audit_log:view"] },
  { id: "bankone", label: "nav.bankone", anyOf: ["customer:repair_bankone", "queues:manage"] },
  { id: "staff", label: "nav.staff", anyOf: ["staff:view"] },
  { id: "roles", label: "nav.roles", anyOf: ["staff:view"] },
  { id: "providers", label: "nav.providers", anyOf: ["provider:view"] },
  { id: "approval-rules", label: "nav.approvalRules", anyOf: ["approval_rules:view"] },
  { id: "platform-config", label: "nav.platformConfig", anyOf: ["config:view"] },
];

export function canAccess(entry: NavAccess, held: ReadonlySet<Permission>): boolean {
  return entry.anyOf === null || entry.anyOf.some((permission) => held.has(permission));
}
