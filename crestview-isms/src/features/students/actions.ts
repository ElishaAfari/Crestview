"use server";

import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema } from "@/lib/validations/student.schema";

export async function createStudentAction(formData: FormData) {
  const result = studentSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    studentNumber: String(formData.get("studentNumber") ?? ""),
    classroomId: String(formData.get("classroomId") ?? ""),
    enrollmentDate: String(formData.get("enrollmentDate") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the student details." };

  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const email = result.data.email.trim().toLowerCase();
  const { data: studentRole } = await admin.from("roles").select("id").eq("name", "student").single();
  if (!studentRole) return { ok: false, message: "The student role is not configured." };

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/api/auth/callback?next=/reset-password`,
    data: { first_name: result.data.firstName.trim(), last_name: result.data.lastName.trim(), role: "student" }
  });
  if (inviteError || !invite.user) return { ok: false, message: "The student invitation could not be sent. The email may already be in use." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: studentRole.id,
    first_name: result.data.firstName.trim(),
    last_name: result.data.lastName.trim(),
    email
  });
  const { error: studentError } = profileError ? { error: profileError } : await admin.from("students").insert({
    profile_id: invite.user.id,
    student_number: result.data.studentNumber.trim(),
    classroom_id: result.data.classroomId,
    enrollment_date: result.data.enrollmentDate
  });

  if (profileError || studentError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return { ok: false, message: "The student record could not be created. Check the student number and classroom." };
  }

  return { ok: true, message: "Student invited and enrolled." };
}
