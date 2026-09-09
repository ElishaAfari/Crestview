import "server-only";

import { redirect } from "next/navigation";
import { ROLES } from "@/config/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleName } from "@/types/database.types";

const inheritedAdminRoles: RoleName[] = [
  "super_admin",
  "school_owner",
  "school_admin",
];

function hasAllowedRole(currentRole: RoleName, allowedRoles: RoleName[]) {
  if (allowedRoles.includes(currentRole)) return true;
  return (
    currentRole === "school_owner" &&
    allowedRoles.some((role) => inheritedAdminRoles.includes(role))
  );
}

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function requireRoles(allowedRoles: RoleName[]) {
  const context = await requireUser();
  const admin = createAdminClient();
  const { data: profileRecord } = await admin
    .from("profiles")
    .select("role_id,is_active,deleted_at")
    .eq("id", context.user.id)
    .maybeSingle();
  const profile = profileRecord as { role_id?: unknown } | null;

  if (
    !profileRecord ||
    profileRecord.is_active === false ||
    profileRecord.deleted_at
  ) {
    redirect("/login?account=inactive");
  }

  if (typeof profile?.role_id !== "string")
    redirect("/login?account=profile-required");

  const { data: roleRecord } = await admin
    .from("roles")
    .select("name")
    .eq("id", profile.role_id)
    .maybeSingle();
  const role = roleRecord as { name?: unknown } | null;

  if (typeof role?.name !== "string") redirect("/login?account=role-required");

  if (!hasAllowedRole(role.name as RoleName, allowedRoles))
    redirect(ROLES[role.name as RoleName]?.dashboard ?? "/dashboard");

  return { ...context, role: role.name as RoleName };
}
