import { request } from "@/shared/api/client";
import { clearTokens, setTokens } from "@/shared/api/tokenStore";
import { toUiPermissions } from "../model/permissionMap";
import type { SessionUser } from "../model/session";

export const MAX_CODE_ATTEMPTS = 5;

interface LoginData {
  access_token: string;
  refresh_token: string;
}

interface MfaChallenge {
  mfa_required: true;
  mfa_enrolled: boolean;
  mfa_token: string;
}

interface MeData {
  admin: { unique_identifier: string; first_name: string; last_name: string; email: string };
  role_code: string | null;
  permissions: string[];
  mfa_enrolled: boolean;
}

/** `session` means tokens are stored and the user can be loaded; `mfa` needs a code (or enrolment) first. */
export type LoginResult =
  { kind: "session" } | { kind: "mfa"; mfaToken: string; enrolled: boolean };

function keepTokens(data: LoginData) {
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const data = await request<LoginData | MfaChallenge>("/admin/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
    auth: false,
  });
  if ("mfa_required" in data) {
    return { kind: "mfa", mfaToken: data.mfa_token, enrolled: data.mfa_enrolled };
  }
  keepTokens(data);
  return { kind: "session" };
}

export async function verifyMfa(mfaToken: string, code: string) {
  const data = await request<LoginData>("/admin/auth/mfa/verify", {
    method: "POST",
    body: { mfa_token: mfaToken, code },
    auth: false,
  });
  keepTokens(data);
}

/** Starts enrolment for an admin who has no authenticator yet. */
export async function beginEnrolment(mfaToken: string) {
  const data = await request<{ secret: string; otpauth_uri: string }>("/admin/auth/mfa/enroll", {
    method: "POST",
    body: { mfa_token: mfaToken },
    auth: false,
  });
  return { secret: data.secret, otpauthUri: data.otpauth_uri };
}

export async function activateMfa(mfaToken: string, code: string) {
  const data = await request<{ session?: LoginData }>("/admin/auth/mfa/activate", {
    method: "POST",
    body: { mfa_token: mfaToken, code },
    auth: false,
  });
  if (data.session) keepTokens(data.session);
}

function titleCase(code: string) {
  const words = code.toLowerCase().split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Loads the signed-in admin with the permissions their role grants. */
export async function fetchSessionUser(): Promise<SessionUser> {
  const me = await request<MeData>("/admin/auth/me");
  return {
    id: me.admin.unique_identifier,
    name: `${me.admin.first_name} ${me.admin.last_name}`.trim(),
    email: me.admin.email,
    roleNames: me.role_code ? [titleCase(me.role_code)] : [],
    permissions: toUiPermissions(me.permissions),
    approvalCeilingKobo: Number.MAX_SAFE_INTEGER,
    twoFactorEnrolled: me.mfa_enrolled,
  };
}

/** Ends the server session, then drops the tokens even if the call fails. */
export async function logout() {
  try {
    await request<void>("/admin/auth/logout", { method: "POST" });
  } catch {
    // The tokens are discarded below either way.
  } finally {
    clearTokens();
  }
}
