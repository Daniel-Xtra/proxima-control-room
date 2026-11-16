import { ApiError, simulate } from "@/shared/api/client";
import { ROLE_TEMPLATES } from "../model/roleTemplates";
import type { SessionUser } from "../model/session";

/** Mock sign-in service. The real endpoints are listed in the PRD backend requirements. */
export const MAX_CODE_ATTEMPTS = 5;
export const SETUP_KEY = "JBSW Y3DP EHPK 3PXP";

export function submitCredentials(email: string, password: string) {
  return simulate(() => {
    if (!email.includes("@") || password.length < 4) {
      throw new ApiError(401, "Email or password is incorrect.");
    }
    return { firstLogin: email.toLowerCase().startsWith("new") };
  });
}

/** Any 6-digit code passes except 000000, so the failure state can be exercised. */
export function verifyTotp(code: string) {
  return simulate(() => {
    if (code === "000000") throw new ApiError(401, "That code is not valid.");
  }, 250);
}

export function setNewPassword(password: string) {
  return simulate(() => {
    if (password.length < 10) throw new ApiError(422, "Password must be at least 10 characters.");
  });
}

export function buildSessionUser(email: string, roleId: string, firstLogin: boolean): SessionUser {
  const role = ROLE_TEMPLATES.find((r) => r.id === roleId) ?? ROLE_TEMPLATES[0]!;
  const local = email.split("@")[0] ?? "staff";
  const name = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
  return {
    id: "00000000-0000-4000-8000-0000000000a1",
    name: name || "Staff Member",
    email,
    roleNames: [role.name],
    permissions: role.permissions,
    approvalCeilingKobo: role.approvalCeilingKobo ?? 0,
    twoFactorEnrolled: true,
    lastLoginAt: firstLogin ? new Date().toISOString() : "2026-11-14T08:12:00.000Z",
  };
}
