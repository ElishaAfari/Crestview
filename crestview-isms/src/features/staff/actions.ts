"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { staffSchema } from "@/lib/validations/staff.schema";

export async function createStaffAction(formData: FormData) {
  const result = staffSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
    staffNumber: String(formData.get("staffNumber") ?? "") || undefined,
    jobTitle: String(formData.get("jobTitle") ?? "") || undefined,
    employmentType: String(formData.get("employmentType") ?? "full_time"),
    role: String(formData.get("role") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the staff details." };

  await requireRoles(["super_admin", "school_admin", "hr_staff"]);
  const admin = createAdminClient();
  const email = result.data.email.trim().toLowerCase();
  const { data: staffRole } = await admin.from("roles").select("id").eq("name", result.data.role).single();
  if (!staffRole) return { ok: false, message: "The selected staff role is not configured." };

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/reset-password`,
    data: { first_name: result.data.firstName.trim(), last_name: result.data.lastName.trim(), role: result.data.role }
  });
  if (inviteError || !invite.user) return { ok: false, message: "The staff invitation could not be sent. The email may already be in use." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: staffRole.id,
    first_name: result.data.firstName.trim(),
    last_name: result.data.lastName.trim(),
    email,
    phone: result.data.phone?.trim() || null
  });
  const staffNumber = result.data.staffNumber?.trim()
    || `CIS-STF-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  const { error: staffProfileError } = profileError ? { error: profileError } : await admin.from("staff_profiles").insert({
    profile_id: invite.user.id,
    staff_number: staffNumber,
    job_title: result.data.jobTitle?.trim() || result.data.role.replaceAll("_", " "),
    employment_type: result.data.employmentType,
    hire_date: new Date().toISOString().slice(0, 10),
    metadata: { role: result.data.role }
  });

  if (profileError || staffProfileError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return { ok: false, message: "The staff profile could not be created. Check the staff number and role." };
  }

  return { ok: true, message: `Staff member invited with staff number ${staffNumber}.` };
}

export async function deactivateStaffAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(formData.get("reason") ?? "No longer belongs to the institution").trim();
  const { user, role: currentRole } = await requireRoles(["super_admin", "school_admin"]);
  if (profileId === user.id) return { ok: false, message: "You cannot deactivate your own administrator account." };

  const admin = createAdminClient();
  const { data: profileData } = await admin.from("profiles").select("id,email,roles(name)").eq("id", profileId).maybeSingle();
  const profile = profileData as unknown as { id: string; email: string; roles: { name: string } | { name: string }[] | null } | null;
  const targetRole = Array.isArray(profile?.roles) ? profile?.roles[0]?.name : profile?.roles?.name;
  if (!profile) return { ok: false, message: "The staff profile could not be found." };
  if (currentRole !== "super_admin" && (targetRole === "super_admin" || targetRole === "school_admin")) {
    return { ok: false, message: "Only the head administrator can deactivate administrator accounts." };
  }

  await admin.auth.admin.updateUserById(profile.id, { ban_duration: "876000h" });
  const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", profile.id);
  if (!error) {
    await admin.from("staff_class_assignments").update({ status: "ended", ends_on: new Date().toISOString().slice(0, 10) }).eq("profile_id", profile.id).eq("status", "active");
    const { data: staffProfile } = await admin.from("staff_profiles").select("id,staff_number,job_title").eq("profile_id", profile.id).maybeSingle();
    await admin.from("account_lifecycle_records").insert({
      profile_id: profile.id,
      staff_profile_id: (staffProfile as { id: string } | null)?.id ?? null,
      action: "archived",
      reason,
      performed_by: user.id,
      snapshot: { email: profile.email, role: targetRole, staff_profile: staffProfile }
    });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/access");
  return error ? { ok: false, message: "The staff account could not be deactivated." } : { ok: true, message: "Staff portal access disabled and record archived." };
}
