"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createPortalInvitation } from "@/lib/email/portal-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema } from "@/lib/validations/student.schema";
import type { Json } from "@/types/database.types";

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

  const invite = await createPortalInvitation({
    admin,
    email,
    firstName: result.data.firstName.trim(),
    lastName: result.data.lastName.trim(),
    role: "student",
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { account_source: "manual_student_enrollment" }
  });
  if (!invite.ok) return { ok: false, message: invite.message };

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

  const delivery = invite.delivery === "crestview" ? "Crestview-branded access email" : "Supabase Auth access email";
  return { ok: true, message: `Student invited and enrolled. ${delivery} sent to ${invite.deliveredTo}.` };
}

export async function withdrawStudentAction(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const reason = String(formData.get("reason") ?? "Withdrawn from administrator student management").trim();
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data: studentData } = await admin
    .from("students")
    .select("id,profile_id,student_number,status,classroom_id,metadata")
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();
  const student = studentData as { id: string; profile_id: string; student_number: string; status: string; classroom_id: string | null; metadata: Json | null } | null;
  if (!student) return { ok: false, message: "The student record could not be found." };

  await admin.auth.admin.updateUserById(student.profile_id, { ban_duration: "876000h" });
  const { error } = await admin.from("students").update({
    status: "withdrawn",
    classroom_id: null,
    metadata: {
      ...(typeof student.metadata === "object" && !Array.isArray(student.metadata) ? student.metadata : {}),
      withdrawn_at: new Date().toISOString(),
      previous_classroom_id: student.classroom_id,
      reason
    } satisfies Json
  }).eq("id", student.id);
  if (!error) {
    await admin.from("profiles").update({ is_active: false }).eq("id", student.profile_id);
    await admin.from("account_lifecycle_records").insert({
      profile_id: student.profile_id,
      student_id: student.id,
      action: "withdrawn",
      reason,
      performed_by: user.id,
      snapshot: { student_number: student.student_number, previous_status: student.status, previous_classroom_id: student.classroom_id }
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return error ? { ok: false, message: "The student could not be withdrawn." } : { ok: true, message: "Student withdrawn and portal access disabled. Historical records are preserved." };
}

export async function promoteClassAction(formData: FormData) {
  const fromClassroomId = String(formData.get("fromClassroomId") ?? "");
  const toClassroomId = String(formData.get("toClassroomId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  if (!fromClassroomId || !toClassroomId || fromClassroomId === toClassroomId) {
    return { ok: false, message: "Choose two different classes for promotion." };
  }

  const admin = createAdminClient();
  const { data: students } = await admin
    .from("students")
    .select("id,status")
    .eq("classroom_id", fromClassroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const studentRows = (students ?? []) as Array<{ id: string; status: string }>;
  if (!studentRows.length) return { ok: false, message: "No active students were found in the source class." };

  const { data: toClassroom } = await admin.from("classrooms").select("id,academic_year_id").eq("id", toClassroomId).is("deleted_at", null).maybeSingle();
  const target = toClassroom as { id: string; academic_year_id: string | null } | null;
  if (!target) return { ok: false, message: "The destination class could not be found." };

  const batchNumber = `PROMO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const { data: batchData, error: batchError } = await admin.from("class_promotion_batches").insert({
    batch_number: batchNumber,
    from_classroom_id: fromClassroomId,
    to_classroom_id: toClassroomId,
    academic_year_id: target.academic_year_id,
    promoted_by: user.id,
    student_count: studentRows.length,
    notes: notes || null
  }).select("id").single();
  const batch = batchData as { id: string } | null;
  if (batchError || !batch) return { ok: false, message: "The promotion batch could not be created." };

  await admin.from("student_promotion_records").insert(studentRows.map((student) => ({
    promotion_batch_id: batch.id,
    student_id: student.id,
    from_classroom_id: fromClassroomId,
    to_classroom_id: toClassroomId,
    previous_status: student.status,
    promoted_by: user.id
  })));
  const { error } = await admin.from("students").update({ classroom_id: toClassroomId }).in("id", studentRows.map((student) => student.id));
  if (!error) {
    await admin.from("account_lifecycle_records").insert({
      action: "promoted",
      reason: `Class promotion ${batchNumber}`,
      performed_by: user.id,
      snapshot: { from_classroom_id: fromClassroomId, to_classroom_id: toClassroomId, student_count: studentRows.length }
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/teacher/classes");
  revalidatePath("/admin");
  return error ? { ok: false, message: "Students could not be promoted." } : { ok: true, message: `${studentRows.length} students promoted under ${batchNumber}.` };
}
