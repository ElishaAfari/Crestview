"use server";

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
