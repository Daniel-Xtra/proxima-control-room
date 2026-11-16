import type { Permission } from "./permissions";

/**
 * The backend grants dotted codes (`customer.freeze.request`); the UI checks `resource:action`
 * permissions. A UI permission is held when the admin has ANY of its backend codes.
 *
 * An empty list means the backend has no matching permission yet, so the UI denies it for
 * everyone. Add the code here once the endpoint and permission exist.
 */
export const PERMISSION_SOURCES: Record<Permission, readonly string[]> = {
  "customer:view": ["customer.view"],
  "customer:view_sensitive": ["customer.view_pii"],
  "customer:export": ["customer.export"],
  "customer:upload_documents": [],
  "customer:reset_password": ["customer.password_reset.request"],
  "customer:unlock": ["customer.unlock_login.request"],
  "customer:restrict": ["customer.restrict.request"],
  "customer:deactivate": [],
  "customer:repair_bankone": ["customer.bankone_repair.execute"],

  "freeze_request:initiate": ["customer.freeze.request"],
  "freeze_request:approve": ["customer.freeze.approve"],
  "unfreeze_request:initiate": ["customer.unfreeze.request"],
  "unfreeze_request:approve": ["customer.unfreeze.approve"],
  "limit_request:initiate": ["customer.limit_change.request"],
  "limit_request:approve": ["customer.limit_change.approve"],
  "request:view_all": [
    "customer.freeze.approve",
    "customer.unfreeze.approve",
    "customer.limit_change.approve",
  ],

  "transaction:view": ["txn.view"],
  "transaction:export": ["txn.export"],
  "transaction:requery": ["txn.requery"],
  "transaction:reverse": ["txn.reversal.request"],
  "transaction:retry": ["txn.retry"],

  "kyc:review": ["kyb.document.review", "kyc.retail.review"],
  "kyc:approve": ["kyb.upgrade_l3.approve"],
  "kyc:reject": [],
  "kyc:override": [],

  "savings:view": [],
  "savings:liquidate": [],

  "bulk_payment:view": [],
  "bulk_payment:initiate": [],
  "bulk_payment:approve": [],

  "compliance:view_alerts": ["risk.alert.view"],
  "compliance:manage_cases": ["risk.case.manage"],
  "compliance:manage_blocklist": [],

  "config:view": ["fee.view", "provider.view"],
  "config:edit": [
    "fee.change.request",
    "limits.tier.change.request",
    "provider.config.change.request",
  ],
  "config:approve": [
    "fee.change.approve",
    "limits.tier.change.approve",
    "provider.config.change.approve",
  ],
  "config:kill_switch": [],

  "content:view": ["banner.manage", "notification.view"],
  "content:edit": ["banner.manage"],
  "content:publish": ["banner.manage"],

  "report:view": ["report.compliance.generate"],
  "report:schedule": [],
  "report:export": [],

  "audit_log:view": ["audit.view"],
  "integrations:view": ["webhook_ip.manage", "provider.view"],
  "integrations:manage": ["webhook_ip.manage"],
  "queues:manage": ["ops.dlq.replay.request"],
  "security_policy:edit": ["settings.account_lock.manage"],

  "staff:view": ["staff.view"],
  "staff:manage": ["staff.invite", "staff.change_role", "staff.disable"],
  "roles:manage": ["staff.change_role"],
  "2fa:reset": ["staff.mfa_reset"],
};

export function toUiPermissions(granted: readonly string[]): Permission[] {
  const held = new Set(granted);
  return (Object.keys(PERMISSION_SOURCES) as Permission[]).filter((permission) =>
    PERMISSION_SOURCES[permission].some((code) => held.has(code)),
  );
}
