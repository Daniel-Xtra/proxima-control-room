import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getRole, listRoleCatalogue, listStaff } from "./accessApi";

export const accessKeys = {
  roles: ["access", "roles"] as const,
  role: (id: string) => ["access", "role", id] as const,
  staff: ["access", "staff"] as const,
};

export const useRoleCatalogue = () => useApiQuery(accessKeys.roles, listRoleCatalogue);
export const useRoles = () =>
  useApiQuery(accessKeys.roles, listRoleCatalogue, { select: (data) => data.roles });
export const useStaff = () => useApiQuery(accessKeys.staff, listStaff);
export const useRole = (id: string) =>
  useApiQuery(accessKeys.role(id), () => getRole(id), { enabled: id !== "new" });
