import { recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { daysAgo } from "@/shared/api/mockFixtures";
import { ROLE_TEMPLATES, type Permission, type RoleTemplate } from "@/features/auth";

export type TwoFactorState = "enrolled" | "not-enrolled" | "reset-pending";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  twoFactor: TwoFactorState;
  active: boolean;
  lastLoginAt: string | null;
}

let roles: RoleTemplate[] = ROLE_TEMPLATES.map((r) => ({ ...r }));

let staff: StaffMember[] = [
  {
    id: "st-1",
    name: "Chuka Obi",
    email: "chuka.obi@proxima.example",
    roleIds: ["role-super-admin"],
    twoFactor: "enrolled",
    active: true,
    lastLoginAt: daysAgo(0, 7),
  },
  {
    id: "st-2",
    name: "Amaka Eze",
    email: "amaka.eze@proxima.example",
    roleIds: ["role-support-lead"],
    twoFactor: "enrolled",
    active: true,
    lastLoginAt: daysAgo(1, 9),
  },
  {
    id: "st-3",
    name: "Tolu Adebayo",
    email: "tolu.adebayo@proxima.example",
    roleIds: ["role-support-1"],
    twoFactor: "enrolled",
    active: true,
    lastLoginAt: daysAgo(0, 8),
  },
  {
    id: "st-4",
    name: "Ife Johnson",
    email: "ife.johnson@proxima.example",
    roleIds: ["role-operations"],
    twoFactor: "enrolled",
    active: true,
    lastLoginAt: daysAgo(2, 14),
  },
  {
    id: "st-5",
    name: "Ngozi Bassey",
    email: "ngozi.bassey@proxima.example",
    roleIds: ["role-compliance"],
    twoFactor: "reset-pending",
    active: true,
    lastLoginAt: daysAgo(9, 10),
  },
  {
    id: "st-6",
    name: "Seyi Martins",
    email: "seyi.martins@proxima.example",
    roleIds: ["role-marketing"],
    twoFactor: "not-enrolled",
    active: true,
    lastLoginAt: null,
  },
  {
    id: "st-7",
    name: "Dayo Ajayi",
    email: "dayo.ajayi@proxima.example",
    roleIds: ["role-auditor"],
    twoFactor: "enrolled",
    active: false,
    lastLoginAt: daysAgo(70, 11),
  },
];

export const listRoles = () =>
  simulate(() =>
    roles.map((r) => ({ ...r, memberCount: staff.filter((s) => s.roleIds.includes(r.id)).length })),
  );

export const getRole = (id: string) =>
  simulate(() => {
    const role = roles.find((r) => r.id === id);
    if (!role) throw new ApiError(404, "Role not found.");
    return { ...role };
  });

export interface RoleInput {
  name: string;
  description: string;
  permissions: Permission[];
  approvalCeilingKobo: number;
}

export function saveRole(id: string | null, input: RoleInput, reason: string) {
  return simulate(() => {
    if (id) {
      const role = roles.find((r) => r.id === id);
      if (!role) throw new ApiError(404, "Role not found.");
      Object.assign(role, input);
      recordAudit({
        action: "role.update",
        target: input.name,
        reason,
        after: `${input.permissions.length} permissions`,
      });
      return role.id;
    }
    const created: RoleTemplate = { id: crypto.randomUUID(), ...input };
    roles = [...roles, created];
    recordAudit({
      action: "role.create",
      target: input.name,
      reason,
      after: `${input.permissions.length} permissions`,
    });
    return created.id;
  });
}

export function retireRole(id: string, reason: string) {
  return simulate(() => {
    const role = roles.find((r) => r.id === id);
    if (staff.some((s) => s.roleIds.includes(id))) {
      throw new ApiError(409, "Reassign staff holding this role before retiring it.");
    }
    roles = roles.filter((r) => r.id !== id);
    recordAudit({ action: "role.retire", target: role?.name ?? id, reason });
  });
}

export const listStaff = () => simulate(() => staff.map((s) => ({ ...s })));

export function assignRoles(staffId: string, roleIds: string[], actorName: string, reason: string) {
  return simulate(() => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) throw new ApiError(404, "Staff member not found.");
    if (member.name === actorName) throw new ApiError(403, "You cannot change your own roles.");
    member.roleIds = roleIds;
    recordAudit({
      action: "staff.roles.assign",
      target: member.name,
      reason,
      after: roleIds.join(", "),
    });
  });
}

export function resetTwoFactor(staffId: string, actorName: string, reason: string) {
  return simulate(() => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) throw new ApiError(404, "Staff member not found.");
    if (member.name === actorName) throw new ApiError(403, "You cannot reset your own 2FA.");
    member.twoFactor = "reset-pending";
    recordAudit({ action: "staff.2fa.reset", target: member.name, reason });
  });
}

export function setStaffActive(staffId: string, active: boolean, reason: string) {
  return simulate(() => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) throw new ApiError(404, "Staff member not found.");
    member.active = active;
    recordAudit({ action: active ? "staff.enable" : "staff.disable", target: member.name, reason });
  });
}
