import type { MessageKey } from "@/shared/i18n/t";

/** Permissions are `resource:action`. Roles are bundles of permissions. */
export const PERMISSIONS_BY_MODULE = {
  customers: [
    "customer:view",
    "customer:view_sensitive",
    "customer:export",
    "customer:upload_documents",
    "customer:reset_password",
    "customer:unlock",
    "customer:restrict",
    "customer:deactivate",
    "customer:repair_bankone",
  ],
  requests: [
    "freeze_request:initiate",
    "freeze_request:approve",
    "unfreeze_request:initiate",
    "unfreeze_request:approve",
    "limit_request:initiate",
    "limit_request:approve",
    "unlock_request:approve",
    "password_reset_request:approve",
    "request:view_all",
  ],
  transactions: [
    "transaction:view",
    "transaction:export",
    "transaction:requery",
    "transaction:reverse",
    "transaction:refund",
    "reversal_request:approve",
    "refund_request:approve",
    "transaction:retry",
  ],
  kyc: [
    "kyc:view",
    "kyc:view_documents",
    "kyc:review",
    "kyc:approve",
    "kyc:reject",
    "kyc:override",
  ],
  savings: ["savings:view", "savings:liquidate"],
  bulk: [
    "bulk_transfer:view",
    "bulk_transfer:initiate",
    "bulk_transfer:approve",
    "platform_wallet:view",
    "platform_wallet:topup_request",
    "platform_wallet:topup_approve",
  ],
  compliance: ["compliance:view_alerts", "compliance:manage_cases", "compliance:manage_blocklist"],
  config: [
    "config:view",
    "config:edit",
    "config:approve",
    "config:kill_switch",
    "approval_rules:view",
    "approval_rules:manage",
  ],
  content: ["content:view", "content:edit", "content:publish"],
  reports: ["report:view", "report:schedule", "report:export"],
  platform: [
    "audit_log:view",
    "integrations:view",
    "integrations:manage",
    "provider:view",
    "provider:manage",
    "queues:manage",
    "security_policy:edit",
  ],
  staff: [
    "staff:view",
    "staff:manage",
    "staff:invite",
    "staff_change:approve",
    "staff:revoke_sessions",
    "roles:manage",
    "2fa:reset",
  ],
} as const;

export type ModuleId = keyof typeof PERMISSIONS_BY_MODULE;
export type Permission = (typeof PERMISSIONS_BY_MODULE)[ModuleId][number];

export const MODULE_IDS = Object.keys(PERMISSIONS_BY_MODULE) as ModuleId[];
export const ALL_PERMISSIONS: Permission[] = MODULE_IDS.flatMap((id) => [
  ...PERMISSIONS_BY_MODULE[id],
]);

export function permissionLabelKey(permission: Permission): MessageKey {
  return `perm.${permission}`;
}

export function moduleLabelKey(id: ModuleId): MessageKey {
  return `module.${id}`;
}

/** Pairs a single role may not hold together (segregation of duties). */
export const CONFLICTS: { a: Permission; b: Permission; reason: MessageKey }[] = [
  { a: "freeze_request:initiate", b: "freeze_request:approve", reason: "conflict.sameRequest" },
  { a: "unfreeze_request:initiate", b: "unfreeze_request:approve", reason: "conflict.sameRequest" },
  { a: "limit_request:initiate", b: "limit_request:approve", reason: "conflict.sameRequest" },
  { a: "bulk_transfer:initiate", b: "bulk_transfer:approve", reason: "conflict.sameRequest" },
  {
    a: "platform_wallet:topup_request",
    b: "platform_wallet:topup_approve",
    reason: "conflict.sameRequest",
  },
  { a: "roles:manage", b: "staff:manage", reason: "conflict.selfAssign" },
  { a: "config:edit", b: "config:approve", reason: "conflict.sameConfig" },
];

export function findConflicts(held: ReadonlySet<Permission>) {
  return CONFLICTS.filter((c) => held.has(c.a) && held.has(c.b));
}
