import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/features/auth/guards";

const roleHome: Record<string, string> = {
  super_admin: "/admin",
  school_admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
  hr_staff: "/hr",
  finance_officer: "/finance",
  it_support: "/it",
  librarian: "/library",
};

export default async function DashboardAliasPage() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role_id,is_active,deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.is_active === false ||
    profile.deleted_at ||
    typeof profile.role_id !== "string"
  ) {
    redirect("/login");
  }

  const { data: role } = await admin
    .from("roles")
    .select("name")
    .eq("id", profile.role_id)
    .maybeSingle();
  const destination =
    typeof role?.name === "string" ? roleHome[role.name] : null;
  redirect(destination ?? "/login");
}
