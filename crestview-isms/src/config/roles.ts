import type { RoleName } from "@/types/database.types";

export const ROLES: Record<RoleName, { label: string; dashboard: string }> = {
  super_admin: { label: "Super Admin", dashboard: "/admin" },
  school_owner: { label: "School Owner", dashboard: "/admin" },
  school_admin: { label: "School Admin", dashboard: "/admin" },
  teacher: { label: "Teacher", dashboard: "/teacher" },
  student: { label: "Student", dashboard: "/student" },
  parent: { label: "Parent", dashboard: "/parent" },
  hr_staff: { label: "HR Staff", dashboard: "/hr" },
  finance_officer: { label: "Finance Officer", dashboard: "/finance" },
  librarian: { label: "Librarian", dashboard: "/library" },
  it_support: { label: "IT Support", dashboard: "/it" },
};

export const ADMIN_ROLES: RoleName[] = [
  "super_admin",
  "school_owner",
  "school_admin",
];

// The proprietor account is deliberately a peer of the technical super-admin
// account. Both can operate the whole school; the separate role only preserves
// a clear audit trail of who performed an action.
export const PRIMARY_ADMIN_ROLES: RoleName[] = ["super_admin", "school_owner"];

export function isAdminRole(role: string | null | undefined): role is RoleName {
  return typeof role === "string" && ADMIN_ROLES.includes(role as RoleName);
}

export function isPrimaryAdminRole(
  role: string | null | undefined,
): role is RoleName {
  return (
    typeof role === "string" && PRIMARY_ADMIN_ROLES.includes(role as RoleName)
  );
}
