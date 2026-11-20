import { request } from "./client";

/** Exchanges a fresh authenticator code for a short step-up window; sensitive admin routes require it. */
export async function stepUp(code: string) {
  await request<{ step_up_until: string }>("/admin/auth/mfa/step-up", {
    method: "POST",
    body: { code },
  });
}
