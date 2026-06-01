import "server-only";

import { roleExperiences } from "@/config/role-experiences";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listPortalAccounts() {
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id,first_name,last_name,email,is_active,onboarding_completed_at,roles(name)").order("created_at", { ascending: false });
  const { data: invitations } = await admin.from("portal_invitations").select("auth_user_id,status,expires_at,created_at").order("created_at", { ascending: false });
  const invitationsByAccount = new Map<string, { status: string; expires_at: string | null }>();
  for (const invitation of invitations ?? []) {
    if (typeof invitation.auth_user_id === "string" && !invitationsByAccount.has(invitation.auth_user_id)) {
      invitationsByAccount.set(invitation.auth_user_id, { status: String(invitation.status), expires_at: invitation.expires_at as string | null });
    }
  }
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
    const invitation = invitationsByAccount.get(profile.id);
    return {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      roleName: role,
      role: experience?.label ?? role.replaceAll("_", " "),
      home: experience?.home ?? "/login",
      isSelf: profile.id === user.id,
      status: profile.is_active === false ? "disabled" : profile.onboarding_completed_at ? "active" : invitation?.status ?? "invited"
    };
  });
}
