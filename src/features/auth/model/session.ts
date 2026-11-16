import type { Permission } from "./permissions";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleNames: string[];
  permissions: Permission[];
  approvalCeilingKobo: number;
  twoFactorEnrolled: boolean;
  lastLoginAt: string;
}
