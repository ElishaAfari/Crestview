import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RoleName } from "@/types/database.types";

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required.");
  }

  return { supabase, user };
}

export async function requireRoles(allowedRoles: RoleName[]) {
  const context = await requireUser();
  const { data: profileRecord } = await context.supabase.from("profiles").select("role_id").eq("id", context.user.id).maybeSingle();
  const profile = profileRecord as { role_id?: unknown } | null;

  if (typeof profile?.role_id !== "string") throw new Error("A school profile is required.");

  const { data: roleRecord } = await context.supabase.from("roles").select("name").eq("id", profile.role_id).maybeSingle();
  const role = roleRecord as { name?: unknown } | null;

  if (typeof role?.name !== "string" || !allowedRoles.includes(role.name as RoleName)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return { ...context, role: role.name as RoleName };
}
