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

function studentPasswordFor(studentNumber: string) {
  return `${studentNumber.replace(/[^a-z0-9]/gi, "").slice(-8)}Cis!`;
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
    const { data: currentProfile } = await admin.from("profiles").select("email,is_active,metadata").eq("id", existing.profile_id).maybeSingle();
    const profile = currentProfile as { email: string; is_active: boolean | null; metadata: Json | null } | null;
    const wasPending = profile?.is_active === false || (typeof profile?.metadata === "object" && !Array.isArray(profile.metadata) && profile.metadata?.student_access_pending === true);
    const password = studentPasswordFor(studentNumber);
    await admin.from("profiles").update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      is_active: true,
      metadata: {
        ...(typeof profile?.metadata === "object" && !Array.isArray(profile.metadata) ? profile.metadata : {}),
        student_access_pending: false,
        student_access_activated_at: new Date().toISOString()
      } satisfies Json
    }).eq("id", existing.profile_id);
    if (wasPending) {
      await admin.auth.admin.updateUserById(existing.profile_id, {
        password,
        user_metadata: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          role: "student",
          student_number: studentNumber
        }
      });
      await admin.from("account_lifecycle_records").insert({
        profile_id: existing.profile_id,
        student_id: existing.id,
        action: "activated",
        reason: "Student portal activated from class roster",
        snapshot: { student_number: studentNumber, classroom_id: classroomId }
      });
    }
    await admin.from("students").update({
      classroom_id: classroomId,
      status: "active",
      metadata: {
        account_source: "teacher_roster_import",
        roster_updated_at: new Date().toISOString()
      } satisfies Json
    }).eq("id", existing.id);
    return { created: false, credential: wasPending && profile?.email ? `${profile.email} / ${password}` : null };
  }

  const email = studentEmailFor(studentNumber);
  const password = studentPasswordFor(studentNumber);
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email,
    password,
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

  const createdStudent = studentError ? null : await admin.from("students").select("id").eq("profile_id", account.user.id).maybeSingle();
  await admin.from("account_lifecycle_records").insert({
    profile_id: account.user.id,
    student_id: (createdStudent?.data as { id: string } | null)?.id ?? null,
    action: "password_issued",
    reason: "Student portal account created from class roster",
    snapshot: { student_number: studentNumber, classroom_id: classroomId }
  });
  return { created: true, credential: `${email} / ${password}` };
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
  const { data: classroomData } = await admin.from("classrooms").select("academic_year_id,name,grade_level").eq("id", classroomId).maybeSingle();
  const classroom = classroomData as { academic_year_id: string | null; name: string; grade_level: string } | null;
  const { data: studentRole } = await admin.from("roles").select("id").eq("name", "student").maybeSingle();
  if (!studentRole) return { ok: false, message: "The student role is not configured." };

  let created = 0;
  let updated = 0;
  const credentials: string[] = [];
  try {
    for (const student of deduped) {
      const outcome = await createStudentFromRoster(student, classroomId, String(studentRole.id));
      if (outcome.created) created += 1;
      else updated += 1;
      if (outcome.credential) credentials.push(outcome.credential);
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

  await admin.from("class_roster_snapshots").insert({
    classroom_id: classroomId,
    academic_year_id: classroom?.academic_year_id ?? null,
    captured_by: user.id,
    snapshot_type: "manual",
    student_count: deduped.length,
    roster: deduped.map((student) => ({
      student_number: student.studentNumber.trim().toUpperCase(),
      first_name: student.firstName.trim(),
      last_name: student.lastName.trim()
    })) satisfies Json,
    notes: classroom ? `${classroom.grade_level} - ${classroom.name} roster saved from portal.` : "Roster saved from portal."
  });

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/attendance");
  revalidatePath("/admin/students");
  revalidatePath("/admin/attendance");
  const credentialMessage = credentials.length
    ? ` Access issued: ${credentials.slice(0, 6).join("; ")}${credentials.length > 6 ? `; +${credentials.length - 6} more` : ""}.`
    : "";
  return { ok: true, message: `${deduped.length} students saved. ${created} new, ${updated} updated.${credentialMessage}` };
}
