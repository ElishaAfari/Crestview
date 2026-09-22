import { PageWrapper } from "@/components/layout/PageWrapper";
import { AccountSettingsForm } from "@/components/forms/AccountSettingsForm";
import { requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AccountSettingsPage() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("first_name,middle_name,last_name,email,phone,roles(name)").eq("id", user.id).single();
  const role = Array.isArray(profile?.roles) ? profile.roles[0]?.name : (profile?.roles as { name?: string } | null)?.name;
  if (!profile) return null;
  return <PageWrapper title="My Account" description="Manage your personal details, password, and account security for this school portal."><AccountSettingsForm profile={{ first_name: profile.first_name, middle_name: profile.middle_name, last_name: profile.last_name, phone: profile.phone, email: profile.email, role: role ?? "authenticated user" }} /></PageWrapper>;
}
