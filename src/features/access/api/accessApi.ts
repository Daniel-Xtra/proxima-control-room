import { ApiError, request, type Page } from "@/shared/api/client";

export type TwoFactorState = "enrolled" | "not-enrolled" | "reset-pending" | "unknown";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  twoFactor: TwoFactorState;
  active: boolean;
  lastLoginAt: string | null;
  /** Signed out of the console by too many wrong passwords. */
  locked: boolean;
  createdAt: string | null;
  /** An invitation that has not been accepted yet; the person stays disabled until they accept. */
  invitation: "pending" | "expired" | null;
}

export interface RoleSummary {
  /** The role code, e.g. FINANCE_ADMIN. */
  id: string;
  name: string;
  description: string;
  /** Built-in roles keep their permissions; only custom roles can change them. */
  isSystem: boolean;
  permissionCodes: string[];
  memberCount: number;
}

export interface PermissionDef {
  code: string;
  displayName: string;
  description: string;
  module: string;
}

export interface RoleCatalogue {
  roles: RoleSummary[];
  permissions: PermissionDef[];
}

interface RoleRow {
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

interface PermissionRow {
  code: string;
  display_name: string;
  description: string | null;
  module: string;
  is_active: boolean;
}

interface StaffRow {
  unique_identifier: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  is_enabled: boolean;
  two_factor?: "enrolled" | "not_enrolled" | "reset_pending";
  last_login_at?: string | null;
  is_locked?: boolean;
  invitation?: "pending" | "expired" | null;
  created_at?: string;
}

interface StaffPage {
  data: StaffRow[];
  total?: number;
}

const TWO_FACTOR = {
  enrolled: "enrolled",
  not_enrolled: "not-enrolled",
  reset_pending: "reset-pending",
} as const;

/** One page of staff for the staff table. */
export async function listStaffPage(
  page: number,
  limit: number,
  search = "",
): Promise<Page<StaffMember>> {
  const result = await request<StaffPage>("/admin/staff", {
    query: { page, limit, search: search.trim() || undefined },
  });
  return {
    items: result.data.map(toStaff),
    total: result.total ?? result.data.length,
    page,
    limit,
  };
}

/** Every staff member (up to 100), for counting who holds each role. */
export async function listStaff(): Promise<StaffMember[]> {
  const page = await request<StaffPage>("/admin/staff", { query: { limit: 100 } });
  return page.data.map(toStaff);
}

const toStaff = (row: StaffRow): StaffMember => ({
  id: row.unique_identifier,
  name: `${row.first_name} ${row.last_name}`.trim(),
  email: row.email,
  roleIds: row.role ? [row.role] : [],
  twoFactor: row.two_factor ? TWO_FACTOR[row.two_factor] : "unknown",
  active: row.is_enabled,
  lastLoginAt: row.last_login_at ?? null,
  locked: row.is_locked ?? false,
  createdAt: row.created_at ?? null,
  invitation: row.invitation ?? null,
});

/** Roles with how many staff hold each, plus every permission a role can be given. */
export async function listRoleCatalogue(): Promise<RoleCatalogue> {
  const [data, staff] = await Promise.all([
    request<{ roles: RoleRow[]; permissions: PermissionRow[] }>("/admin/roles", {
      query: { limit: 100 },
    }),
    listStaff(),
  ]);
  return {
    roles: data.roles.map((role) => ({
      id: role.code,
      name: role.name,
      description: role.description ?? "",
      isSystem: role.is_system,
      permissionCodes: role.permissions,
      memberCount: staff.filter((member) => member.roleIds.includes(role.code)).length,
    })),
    permissions: data.permissions
      .filter((permission) => permission.is_active)
      .map((permission) => ({
        code: permission.code,
        displayName: permission.display_name,
        description: permission.description ?? "",
        module: permission.module,
      })),
  };
}

export async function getRole(id: string): Promise<RoleSummary> {
  const role = (await listRoleCatalogue()).roles.find((candidate) => candidate.id === id);
  if (!role) throw new ApiError(404, "Role not found.");
  return role;
}

export interface RoleInput {
  /** Needed when creating: capital letters, digits and underscores. */
  code?: string;
  name: string;
  description: string;
  permissions: string[];
}

/** Creates a role, or updates one when `id` is given. Returns the role code. */
export async function saveRole(id: string | null, input: RoleInput, reason: string) {
  if (id) {
    await request(`/admin/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: {
        name: input.name,
        description: input.description,
        permissions: input.permissions,
        reason,
      },
    });
    return id;
  }
  await request("/admin/roles", {
    method: "POST",
    body: {
      code: input.code,
      name: input.name,
      description: input.description || undefined,
      permissions: input.permissions,
      reason,
    },
  });
  return input.code ?? "";
}

export async function retireRole(id: string, reason: string) {
  await request(`/admin/roles/${encodeURIComponent(id)}`, { method: "DELETE", body: { reason } });
}

const staffPath = (id: string, action: string) =>
  `/admin/staff/${encodeURIComponent(id)}/${action}`;

/** Staff changes are requests: another admin approves them in the requests inbox. */
function staffRequest(staffId: string, action: string, body: Record<string, unknown>) {
  return request(staffPath(staffId, action), {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body,
  });
}

/** The API gives each staff member one role. */
export async function assignRole(staffId: string, roleCode: string, reason: string) {
  await staffRequest(staffId, "role", { role_code: roleCode, reason });
}

export async function resetTwoFactor(staffId: string, reason: string) {
  await staffRequest(staffId, "mfa/reset", { reason });
}

export async function setStaffActive(staffId: string, active: boolean, reason: string) {
  await staffRequest(staffId, active ? "enable" : "disable", { reason });
}

/** Ending sessions takes effect straight away, with no second approval. */
export async function revokeStaffSessions(staffId: string, reason: string) {
  await request(staffPath(staffId, "sessions/revoke"), { method: "POST", body: { reason } });
}

export interface InviteInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleCode: string;
}

/** Creates the account (disabled) and emails a single-use link where the person sets a password. */
export async function inviteStaff(input: InviteInput) {
  await request("/admin/staff/invite", {
    method: "POST",
    body: {
      email: input.email.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone_number: input.phone.trim(),
      role_code: input.roleCode,
    },
  });
}

/** A fresh link; the previous one stops working. */
export async function resendInvitation(staffId: string) {
  await request(staffPath(staffId, "invitation/resend"), { method: "POST" });
}

/** Cancels an invitation that has not been accepted; the staff record is removed. */
export async function revokeInvitation(staffId: string) {
  await request(staffPath(staffId, "invitation/revoke"), { method: "POST" });
}

/** One page of roles for the roles table, with how many staff hold each. */
export async function listRolesPage(
  page: number,
  limit: number,
  search = "",
): Promise<Page<RoleSummary>> {
  const [data, staff] = await Promise.all([
    request<{ roles: RoleRow[]; total?: number }>("/admin/roles", {
      query: { page, limit, search: search.trim() || undefined },
    }),
    listStaff(),
  ]);
  return {
    items: data.roles.map((role) => ({
      id: role.code,
      name: role.name,
      description: role.description ?? "",
      isSystem: role.is_system,
      permissionCodes: role.permissions,
      memberCount: staff.filter((member) => member.roleIds.includes(role.code)).length,
    })),
    total: data.total ?? data.roles.length,
    page,
    limit,
  };
}
