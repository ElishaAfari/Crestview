"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const rosterStudentSchema = z.object({
  studentNumber: z.string().trim().min(2).max(64),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80)
});

const rosterSchema = z.array(rosterStudentSchema).min(1).max(120);

function studentEmailFor(studentNumber: string) {
  const slug = studentNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || crypto.randomUUID()}@students.crestview.local`;
}

async function canManageClassroom(userId: string, role: string, classroomId: string) {
  if (role === "super_admin" || role === "school_admin") return true;
  const admin = createAdminClient();
  const { data: leadCourses } = await admin
    .from("courses")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("teacher_id", userId)
    .is("deleted_at", null);
  const courseIds = ((leadCourses ?? []) as Array<{ id: string }>).map((course) => course.id);
  if (courseIds.length) return true;

  const { data: classroomCourses } = await admin
    .from("courses")
    .select("id")
    .eq("classroom_id", classroomId)
    .is("deleted_at", null);
  const classroomCourseIds = ((classroomCourses ?? []) as Array<{ id: string }>).map((course) => course.id);
  if (!classroomCourseIds.length) return false;

  const { count } = await admin
    .from("teacher_assignments")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", userId)
    .in("course_id", classroomCourseIds)
    .is("deleted_at", null);
  return Boolean(count);
}

async function createStudentFromRoster(input: z.infer<typeof rosterStudentSchema>, classroomId: string, studentRoleId: string) {
  const admin = createAdminClient();
  const studentNumber = input.studentNumber.trim().toUpperCase();
  const { data: existingStudent } = await admin
    .from("students")
    .select("id,profile_id")
    .eq("student_number", studentNumber)
    .maybeSingle();
  const existing = existingStudent as { id: string; profile_id: string } | null;

  if (existing) {
    await admin.from("profiles").update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      is_active: true
    }).eq("id", existing.profile_id);
    await admin.from("students").update({
      classroom_id: classroomId,
      status: "active",
      metadata: {
        account_source: "teacher_roster_import",
        roster_updated_at: new Date().toISOString()
      } satisfies Json
    }).eq("id", existing.id);
    return { created: false };
  }

  const email = studentEmailFor(studentNumber);
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      role: "student",
      student_number: studentNumber,
      account_source: "teacher_roster_import"
    }
  });
  if (accountError || !account.user) {
    throw new Error(`Could not create ${studentNumber}.`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: account.user.id,
    role_id: studentRoleId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email,
    metadata: {
      account_source: "teacher_roster_import",
      student_number: studentNumber
    } satisfies Json
  });
  const { error: studentError } = profileError ? { error: profileError } : await admin.from("students").insert({
    profile_id: account.user.id,
    student_number: studentNumber,
    classroom_id: classroomId,
    enrollment_date: new Date().toISOString().slice(0, 10),
    status: "active",
    metadata: {
      account_source: "teacher_roster_import",
      roster_created_at: new Date().toISOString()
    } satisfies Json
  });

  if (profileError || studentError) {
    await admin.auth.admin.deleteUser(account.user.id);
    throw new Error(`Could not save ${studentNumber}.`);
  }

  return { created: true };
}

export async function saveClassRosterAction(formData: FormData) {
  const classroomId = String(formData.get("classroomId") ?? "");
  const rosterJson = String(formData.get("rosterJson") ?? "[]");
  if (!z.string().uuid().safeParse(classroomId).success) return { ok: false, message: "Choose a valid class." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rosterJson);
  } catch {
    return { ok: false, message: "The class list could not be read." };
  }

  const result = rosterSchema.safeParse(parsed);
  if (!result.success) return { ok: false, message: "Add student IDs, first names, and last names before saving." };

  const deduped = Array.from(new Map(result.data.map((student) => [student.studentNumber.trim().toUpperCase(), student])).values());
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const allowed = await canManageClassroom(user.id, role, classroomId);
  if (!allowed) return { ok: false, message: "You can only manage rosters for classes assigned to you." };

  const admin = createAdminClient();
  const { data: studentRole } = await admin.from("roles").select("id").eq("name", "student").maybeSingle();
  if (!studentRole) return { ok: false, message: "The student role is not configured." };

  let created = 0;
  let updated = 0;
  try {
    for (const student of deduped) {
      const outcome = await createStudentFromRoster(student, classroomId, String(studentRole.id));
      if (outcome.created) created += 1;
      else updated += 1;
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The class roster could not be saved." };
  }

  const incomingNumbers = deduped.map((student) => student.studentNumber.trim().toUpperCase());
  const { data: currentStudents } = await admin
    .from("students")
    .select("id,student_number,metadata")
    .eq("classroom_id", classroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const removableIds = ((currentStudents ?? []) as Array<{ id: string; student_number: string; metadata: Json | null }>)
    .filter((student) => !incomingNumbers.includes(student.student_number) && typeof student.metadata === "object" && !Array.isArray(student.metadata) && student.metadata?.account_source === "teacher_roster_import")
    .map((student) => student.id);
  if (removableIds.length) {
    await admin.from("students").update({ status: "withdrawn", classroom_id: null }).in("id", removableIds);
  }

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/attendance");
  revalidatePath("/admin/students");
  revalidatePath("/admin/attendance");
  return { ok: true, message: `${deduped.length} students saved. ${created} new, ${updated} updated.` };
}
