import type { Permission } from "./permissions";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleNames: string[];
  permissions: Permission[];
  /** The admin API sends no approval ceiling yet, so the UI does not block on it; the backend enforces limits. */
  approvalCeilingKobo: number;
  twoFactorEnrolled: boolean;
}
