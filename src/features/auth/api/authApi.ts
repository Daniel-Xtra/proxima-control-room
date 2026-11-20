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
  email_code_available?: boolean;
}

interface MeData {
  admin: { unique_identifier: string; first_name: string; last_name: string; email: string };
  role_code: string | null;
  permissions: string[];
  mfa_enrolled: boolean;
  recovery_codes_remaining?: number;
}

/** `session` means tokens are stored and the user can be loaded; `mfa` needs a code (or enrolment) first. */
export type LoginResult =
  | { kind: "session" }
  | { kind: "mfa"; mfaToken: string; enrolled: boolean; emailCodeAvailable: boolean };

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
    return {
      kind: "mfa",
      mfaToken: data.mfa_token,
      enrolled: data.mfa_enrolled,
      emailCodeAvailable: data.email_code_available ?? false,
    };
  }
  keepTokens(data);
  return { kind: "session" };
}

/** Signs in with an authenticator code, a one-time recovery code, or a code that was emailed. */
export async function verifyMfa(
  mfaToken: string,
  proof: { code: string } | { recoveryCode: string } | { emailCode: string },
) {
  const data = await request<LoginData>("/admin/auth/mfa/verify", {
    method: "POST",
    body: {
      mfa_token: mfaToken,
      ...("code" in proof
        ? { code: proof.code }
        : "emailCode" in proof
          ? { email_code: proof.emailCode }
          : { recovery_code: proof.recoveryCode }),
    },
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

/** Confirms enrolment. The recovery codes come back once, and are never sent again. */
export async function activateMfa(mfaToken: string, code: string): Promise<string[]> {
  const data = await request<{ session?: LoginData; recovery_codes?: string[] }>(
    "/admin/auth/mfa/activate",
    { method: "POST", body: { mfa_token: mfaToken, code }, auth: false },
  );
  if (data.session) keepTokens(data.session);
  return data.recovery_codes ?? [];
}

/** Emails a one-time sign-in code to the admin. The address comes back masked. */
export async function sendEmailCode(mfaToken: string) {
  const data = await request<{
    sent_to: string;
    expires_in_seconds: number;
    resend_in_seconds: number;
  }>("/admin/auth/mfa/email-code", {
    method: "POST",
    body: { mfa_token: mfaToken },
    auth: false,
  });
  return {
    sentTo: data.sent_to,
    expiresInSeconds: data.expires_in_seconds,
    resendInSeconds: data.resend_in_seconds,
  };
}

/** How many recovery codes the signed-in admin can still use. */
export async function fetchRecoveryCodesRemaining(): Promise<number> {
  const me = await request<MeData>("/admin/auth/me");
  return me.recovery_codes_remaining ?? 0;
}

/** Replaces the signed-in admin's recovery codes. The old ones stop working. Needs a fresh step-up first. */
export async function regenerateRecoveryCodes(): Promise<string[]> {
  const data = await request<{ recovery_codes: string[] }>("/admin/auth/mfa/recovery-codes", {
    method: "POST",
  });
  return data.recovery_codes;
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

export interface InvitationPreview {
  email: string;
  firstName: string;
  lastName: string;
  roleCode: string;
}

/** The emailed link is the credential: it is valid once and expires. */
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const data = await request<{
    email: string;
    first_name: string;
    last_name: string;
    role_code: string;
  }>("/admin/auth/invitation/preview", { query: { token }, auth: false });
  return {
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    roleCode: data.role_code,
  };
}

export async function previewPasswordReset(token: string) {
  const data = await request<{ email: string; first_name: string }>(
    "/admin/auth/password-reset/preview",
    { query: { token }, auth: false },
  );
  return { email: data.email, firstName: data.first_name };
}

export async function completePasswordReset(token: string, password: string) {
  await request("/admin/auth/password-reset", {
    method: "POST",
    body: { token, password },
    auth: false,
  });
}

/** Asks another admin to reset your own sign-in. Nothing changes until they approve. */
export async function requestOwnReset(kind: "password" | "mfa", userId: string, reason: string) {
  await request("/admin/approvals", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: {
      type: kind === "mfa" ? "STAFF_SELF_MFA_RESET" : "STAFF_SELF_PASSWORD_RESET",
      target_id: userId,
      reason,
    },
  });
}

export async function acceptInvitation(token: string, password: string) {
  await request("/admin/auth/invitation/accept", {
    method: "POST",
    body: { token, password },
    auth: false,
  });
}
