import "server-only";

import { roleExperiences } from "@/config/role-experiences";
import { requireRoles } from "@/features/auth/guards";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listPortalAccounts() {
  const { supabase } = await requireRoles(["super_admin", "school_admin"]);
  const { data } = await supabase.from("profiles").select("id,first_name,last_name,email,is_active,onboarding_completed_at,roles(name)").order("created_at", { ascending: false });
  const records = (data ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean | null;
    onboarding_completed_at: string | null;
    roles: Relation<{ name: string }>;
  }>;

  return records.map((profile) => {
    const role = one(profile.roles)?.name ?? "unassigned";
    const experience = roleExperiences.find((item) => item.role === role);
    return {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      role: experience?.label ?? role.replaceAll("_", " "),
      home: experience?.home ?? "/login",
      status: profile.is_active === false ? "disabled" : profile.onboarding_completed_at ? "active" : "invited"
    };
  });
}
