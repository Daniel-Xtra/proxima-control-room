import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getRole, listRoles, listStaff } from "./accessApi";

export const accessKeys = {
  roles: ["access", "roles"] as const,
  role: (id: string) => ["access", "role", id] as const,
  staff: ["access", "staff"] as const,
};

export const useRoles = () => useApiQuery(accessKeys.roles, listRoles);
export const useStaff = () => useApiQuery(accessKeys.staff, listStaff);
export const useRole = (id: string) =>
  useApiQuery(accessKeys.role(id), () => getRole(id), { enabled: id !== "new" });
