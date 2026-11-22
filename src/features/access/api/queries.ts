import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { getRole, listRoleCatalogue, listRolesPage, listStaffPage } from "./accessApi";

export const accessKeys = {
  roles: ["access", "roles"] as const,
  role: (id: string) => ["access", "role", id] as const,
  staff: ["access", "staff"] as const,
};

export const useRoleCatalogue = () => useApiQuery(accessKeys.roles, listRoleCatalogue);
export const useRoles = () =>
  useApiQuery(accessKeys.roles, listRoleCatalogue, { select: (data) => data.roles });
export const useStaff = (page: number, limit: number, search = "") =>
  useApiQuery(
    [...accessKeys.staff, page, limit, search],
    () => listStaffPage(page, limit, search),
    {
      keepPreviousPage: true,
    },
  );
export const useRole = (id: string) =>
  useApiQuery(accessKeys.role(id), () => getRole(id), { enabled: id !== "new" });
export const useRolesPage = (page: number, limit: number, search = "") =>
  useApiQuery(
    [...accessKeys.roles, "page", page, limit, search],
    () => listRolesPage(page, limit, search),
    {
      keepPreviousPage: true,
    },
  );
