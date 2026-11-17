import { request } from "@/shared/api/client";

export interface ApprovalRule {
  type: string;
  targetType: string;
  requestPermissions: string[];
  approvePermissions: string[];
  expiryHours: number;
  defaultExpiryHours: number;
  overridden: boolean;
  updatedByName: string | null;
  updatedAt: string | null;
  lastChangeReason: string | null;
}

export interface ApprovalRules {
  rules: ApprovalRule[];
  minExpiryHours: number;
  maxExpiryHours: number;
}

interface RuleRow {
  type: string;
  target_type: string;
  request_permissions: string[];
  approve_permissions: string[];
  expiry_hours: number;
  default_expiry_hours: number;
  is_overridden: boolean;
  updated_by_name: string | null;
  updated_at: string | null;
  last_change_reason: string | null;
}

interface RulesResponse {
  data: RuleRow[];
  bounds: { min_expiry_hours: number; max_expiry_hours: number };
}

export async function listApprovalRules(): Promise<ApprovalRules> {
  const result = await request<RulesResponse>("/admin/approval-rules");
  return {
    rules: result.data.map((row) => ({
      type: row.type,
      targetType: row.target_type,
      requestPermissions: row.request_permissions,
      approvePermissions: row.approve_permissions,
      expiryHours: row.expiry_hours,
      defaultExpiryHours: row.default_expiry_hours,
      overridden: row.is_overridden,
      updatedByName: row.updated_by_name,
      updatedAt: row.updated_at,
      lastChangeReason: row.last_change_reason,
    })),
    minExpiryHours: result.bounds.min_expiry_hours,
    maxExpiryHours: result.bounds.max_expiry_hours,
  };
}

/** `null` puts the rule back to its default. */
export async function setApprovalExpiry(type: string, expiryHours: number | null, reason: string) {
  await request(`/admin/approval-rules/${encodeURIComponent(type)}`, {
    method: "PUT",
    body: { expiry_hours: expiryHours, reason },
  });
}
