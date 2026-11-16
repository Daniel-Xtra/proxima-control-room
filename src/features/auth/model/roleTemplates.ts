import { ALL_PERMISSIONS, type Permission } from "./permissions";

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  /** Break-glass role: segregation warnings are shown but not enforced for it. */
  exemptFromConflicts?: boolean;
  /** Highest limit increase (kobo) this role may approve. */
  approvalCeilingKobo?: number;
}

const VIEW: Permission[] = [
  "customer:view",
  "transaction:view",
  "savings:view",
  "request:view_all",
];

/** Editable starter roles to ship with. Not fixed roles. */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Full access. Break-glass procedure applies.",
    permissions: ALL_PERMISSIONS,
    exemptFromConflicts: true,
    approvalCeilingKobo: 500_000_000,
  },
  {
    id: "role-compliance",
    name: "Compliance Officer",
    description: "KYC review, AML alerts and cases.",
    permissions: [
      ...VIEW,
      "customer:view_sensitive",
      "kyc:review",
      "kyc:approve",
      "kyc:reject",
      "compliance:view_alerts",
      "compliance:manage_cases",
      "compliance:manage_blocklist",
      "audit_log:view",
      "report:view",
      "report:export",
    ],
  },
  {
    id: "role-finance",
    name: "Finance and Treasury",
    description: "Transactions, reconciliation and reports.",
    permissions: [
      ...VIEW,
      "transaction:export",
      "transaction:requery",
      "transaction:reverse",
      "savings:liquidate",
      "bulk_payment:view",
      "bulk_payment:initiate",
      "report:view",
      "report:schedule",
      "report:export",
      "config:view",
    ],
  },
  {
    id: "role-operations",
    name: "Operations",
    description: "Stuck transactions, queues and provider health.",
    permissions: [
      ...VIEW,
      "transaction:requery",
      "transaction:retry",
      "customer:repair_bankone",
      "queues:manage",
      "integrations:view",
      "config:view",
      "bulk_payment:view",
      "bulk_payment:approve",
      "limit_request:approve",
      "freeze_request:approve",
      "unfreeze_request:approve",
    ],
    approvalCeilingKobo: 100_000_000,
  },
  {
    id: "role-support-1",
    name: "Customer Support Level 1",
    description: "Look up customers and raise requests.",
    permissions: [
      ...VIEW,
      "freeze_request:initiate",
      "unfreeze_request:initiate",
      "limit_request:initiate",
      "transaction:export",
    ],
  },
  {
    id: "role-support-lead",
    name: "Customer Support Lead",
    description: "Support actions plus approvals up to a ceiling.",
    permissions: [
      ...VIEW,
      "customer:unlock",
      "customer:reset_password",
      "customer:upload_documents",
      "customer:export",
      "customer:view_sensitive",
      "transaction:export",
      "freeze_request:approve",
      "unfreeze_request:approve",
      "limit_request:approve",
      "savings:liquidate",
    ],
    approvalCeilingKobo: 20_000_000,
  },
  {
    id: "role-risk",
    name: "Risk and Fraud Analyst",
    description: "Restrictions, alerts and blocklists.",
    permissions: [
      ...VIEW,
      "customer:restrict",
      "customer:view_sensitive",
      "compliance:view_alerts",
      "compliance:manage_cases",
      "compliance:manage_blocklist",
      "audit_log:view",
      "freeze_request:initiate",
      "unfreeze_request:initiate",
    ],
  },
  {
    id: "role-marketing",
    name: "Marketing",
    description: "Banners, broadcasts and campaigns.",
    permissions: ["content:view", "content:edit", "content:publish", "report:view"],
  },
  {
    id: "role-auditor",
    name: "Read-only Auditor",
    description: "View everything, change nothing.",
    permissions: [
      ...VIEW,
      "audit_log:view",
      "config:view",
      "content:view",
      "report:view",
      "staff:view",
      "integrations:view",
    ],
  },
  {
    id: "role-integrations",
    name: "Integrations Engineer",
    description: "Webhooks, providers and queues.",
    permissions: [
      "integrations:view",
      "integrations:manage",
      "queues:manage",
      "config:view",
      "audit_log:view",
      "security_policy:edit",
    ],
  },
];
