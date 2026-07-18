"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createWorkflowTask } from "@/features/automation/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const attendanceSchema = z.object({
  studentId: z.string().uuid(),
  classroomId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  attendanceDate: z.string().date(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().max(1000).optional()
});

const bulkAttendanceSchema = z.object({
  classroomId: z.string().uuid(),
  attendanceDate: z.string().date()
});

const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);

const scannedAttendanceSchema = z.object({
  studentLookup: z.string().trim().min(4).max(160),
  classroomId: z.string().uuid(),
  attendanceDate: z.string().date(),
  status: z.enum(["present", "absent", "late", "excused"]).default("present"),
  notes: z.string().trim().max(1000).optional()
});

type Relation<T> = T | T[] | null;
type StudentLookupResult = {
  id: string;
  student_number: string;
  classroom_id: string | null;
  status: string;
  profiles: Relation<{ first_name: string; last_name: string }>;
};

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeStudentLookup(value: string) {
  const trimmed = value.trim();
  const withoutPrefix = trimmed.replace(/^CIS-STUDENT[:\s-]*/i, "");
  return withoutPrefix.trim().toUpperCase();
}

function studentDisplayName(student: StudentLookupResult) {
  const profile = one(student.profiles);
  return profile ? `${profile.first_name} ${profile.last_name}` : student.student_number;
}

async function findStudentByLookup(admin: ReturnType<typeof createAdminClient>, lookupValue: string) {
  const rawLookup = lookupValue.trim();
  const normalizedLookup = normalizeStudentLookup(rawLookup);
  const { data: cardData } = await admin
    .from("student_id_cards")
    .select("student_id,student_number")
    .eq("qr_payload", rawLookup)
    .is("deleted_at", null)
    .maybeSingle();
  const card = cardData as { student_id: string; student_number: string } | null;

  let query = admin
    .from("students")
    .select("id,student_number,classroom_id,status,profiles!students_profile_id_fkey(first_name,last_name)")
    .is("deleted_at", null);
  query = card?.student_id ? query.eq("id", card.student_id) : query.eq("student_number", normalizedLookup);

  const { data } = await query.maybeSingle();
  return data as unknown as StudentLookupResult | null;
}

async function userCanRecordClassroomAttendance(admin: ReturnType<typeof createAdminClient>, userId: string, role: string | null, classroomId: string) {
  if (role === "super_admin" || role === "school_admin") return true;
  if (role !== "teacher") return false;
  const [leadCourses, assignedCourses] = await Promise.all([
    admin.from("courses").select("id").eq("teacher_id", userId).eq("classroom_id", classroomId).is("deleted_at", null).limit(1),
    admin
      .from("teacher_assignments")
      .select("courses!inner(id,classroom_id)")
      .eq("teacher_id", userId)
      .eq("courses.classroom_id", classroomId)
      .is("deleted_at", null)
      .limit(1)
  ]);
  return Boolean((leadCourses.data ?? []).length || (assignedCourses.data ?? []).length);
}

export async function recordAttendanceAction(formData: FormData) {
  const result = attendanceSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    classroomId: String(formData.get("classroomId") ?? "") || undefined,
    courseId: String(formData.get("courseId") ?? "") || undefined,
    attendanceDate: String(formData.get("attendanceDate") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the attendance details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const { error } = await admin.from("attendance_records").upsert({
    student_id: result.data.studentId,
    classroom_id: result.data.classroomId ?? null,
    course_id: result.data.courseId ?? null,
    attendance_date: result.data.attendanceDate,
    status: result.data.status,
    notes: result.data.notes?.trim() || null,
    recorded_by: user.id
  }, { onConflict: "student_id,attendance_date,course_id" });

  if (error) return { ok: false, message: "Attendance could not be recorded." };
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  return { ok: true, message: "Attendance recorded." };
}

export async function recordScannedAttendanceAction(formData: FormData) {
  const result = scannedAttendanceSchema.safeParse({
    studentLookup: String(formData.get("studentLookup") ?? ""),
    classroomId: String(formData.get("classroomId") ?? ""),
    attendanceDate: String(formData.get("attendanceDate") ?? ""),
    status: String(formData.get("status") ?? "present"),
    notes: String(formData.get("notes") ?? "") || undefined
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the scanned attendance details." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const student = await findStudentByLookup(admin, result.data.studentLookup);
  if (!student) return { ok: false, message: "No active student matched that ID or QR code." };
  if (student.status !== "active") return { ok: false, message: "Attendance can only be recorded for active students." };
  if (student.classroom_id !== result.data.classroomId) return { ok: false, message: "The scanned student does not belong to the selected class." };
  const canRecord = await userCanRecordClassroomAttendance(admin, user.id, role, result.data.classroomId);
  if (!canRecord) return { ok: false, message: "You can only scan attendance for your assigned class." };

  const { data: classroomData } = await admin
    .from("classrooms")
    .select("id,name,academic_year_id")
    .eq("id", result.data.classroomId)
    .is("deleted_at", null)
    .maybeSingle();
  const classroom = classroomData as { id: string; name: string; academic_year_id: string | null } | null;
  if (!classroom) return { ok: false, message: "The selected class could not be found." };

  const { data: existingRegisterData } = await admin
    .from("attendance_registers")
    .select("id,status")
    .eq("classroom_id", result.data.classroomId)
    .eq("attendance_date", result.data.attendanceDate)
    .is("deleted_at", null)
    .maybeSingle();
  const existingRegister = existingRegisterData as { id: string; status: string } | null;
  if (existingRegister?.status === "locked") {
    return { ok: false, message: "This attendance register is locked. Ask an administrator to reopen it before scanning more records." };
  }

  let registerId = existingRegister?.id ?? "";
  if (!registerId) {
    const { data: registerData, error: registerInsertError } = await admin.from("attendance_registers").insert({
      classroom_id: result.data.classroomId,
      academic_year_id: classroom.academic_year_id,
      attendance_date: result.data.attendanceDate,
      status: "draft",
      submitted_by: user.id,
      counts: { present: 0, late: 0, absent: 0, excused: 0, total: 0 } satisfies Json,
      metadata: {
        source: "qr_attendance_register",
        classroom_name: classroom.name
      } satisfies Json
    }).select("id").single();
    if (registerInsertError || !registerData) return { ok: false, message: "The QR attendance register could not be opened." };
    registerId = String((registerData as { id: string }).id);
  }

  const now = new Date().toISOString();
  const { error: clearError } = await admin
    .from("attendance_records")
    .update({ deleted_at: now })
    .eq("student_id", student.id)
    .eq("classroom_id", result.data.classroomId)
    .eq("attendance_date", result.data.attendanceDate)
    .is("course_id", null)
    .is("deleted_at", null);
  if (clearError) return { ok: false, message: "The previous attendance record could not be refreshed." };

  const { error: insertError } = await admin.from("attendance_records").insert({
    student_id: student.id,
    classroom_id: result.data.classroomId,
    course_id: null,
    attendance_date: result.data.attendanceDate,
    status: result.data.status,
    recorded_by: user.id,
    notes: result.data.notes || null,
    register_id: registerId
  });
  if (insertError) return { ok: false, message: "The scanned attendance record could not be saved." };

  const { data: records } = await admin
    .from("attendance_records")
    .select("status")
    .eq("classroom_id", result.data.classroomId)
    .eq("attendance_date", result.data.attendanceDate)
    .is("course_id", null)
    .is("deleted_at", null);
  const counts = ((records ?? []) as Array<{ status: string }>).reduce<Record<string, number>>((summary, row) => {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
    summary.total = (summary.total ?? 0) + 1;
    return summary;
  }, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });

  await admin.from("attendance_registers").update({
    status: existingRegister?.status === "submitted" ? "submitted" : "draft",
    counts: counts as Json,
    submitted_by: user.id,
    metadata: {
      source: "qr_attendance_register",
      last_scan_at: now,
      last_scanned_student_id: student.id,
      last_scanned_student_number: student.student_number
    } satisfies Json
  }).eq("id", registerId);

  if (result.data.status === "absent" || result.data.status === "late") {
    await createWorkflowTask({
      title: `Attendance follow-up for ${studentDisplayName(student)}`,
      workflowKey: "attendance_follow_up",
      description: `${studentDisplayName(student)} was marked ${result.data.status} from QR/manual scan on ${result.data.attendanceDate}. Verify the reason and contact guardian where needed.`,
      priority: result.data.status === "absent" ? "high" : "normal",
      dueAt: new Date(`${result.data.attendanceDate}T17:00:00`).toISOString(),
      assignedTo: user.id,
      createdBy: user.id,
      studentId: student.id,
      classroomId: result.data.classroomId,
      relatedTable: "attendance_registers",
      relatedRecordId: registerId,
      metadata: {
        attendance_date: result.data.attendanceDate,
        student_number: student.student_number,
        source: "qr_attendance_scan"
      } satisfies Json
    });
  }

  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "attendance.register_submitted");
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/parent");
  return { ok: true, message: `${studentDisplayName(student)} marked ${result.data.status} for ${result.data.attendanceDate}.` };
}

export async function bulkRecordAttendanceAction(formData: FormData) {
  const result = bulkAttendanceSchema.safeParse({
    classroomId: String(formData.get("classroomId") ?? ""),
    attendanceDate: String(formData.get("attendanceDate") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the attendance register." };

  const submittedStatuses = Array.from(formData.entries()).flatMap(([key, value]) => {
    if (!key.startsWith("status:")) return [];
    const studentId = key.slice("status:".length);
    const status = attendanceStatusSchema.safeParse(String(value));
    return status.success && studentId ? [{ studentId, status: status.data }] : [];
  });

  if (!submittedStatuses.length) return { ok: false, message: "Select at least one student in the register." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const { data: existingRegisterData } = await admin
    .from("attendance_registers")
    .select("id,status")
    .eq("classroom_id", result.data.classroomId)
    .eq("attendance_date", result.data.attendanceDate)
    .is("deleted_at", null)
    .maybeSingle();
  const existingRegister = existingRegisterData as { id: string; status: string } | null;
  if (role === "teacher" && existingRegister && ["submitted", "locked"].includes(existingRegister.status)) {
    return { ok: false, message: "This class attendance register has already been submitted for the selected day. Ask an administrator to reopen it for correction." };
  }

  const { data: courses } = await admin
    .from("courses")
    .select("id,teacher_id,academic_year_id")
    .eq("classroom_id", result.data.classroomId)
    .is("deleted_at", null);
  const classroomCourses = (courses ?? []) as Array<{ id: string; teacher_id: string | null; academic_year_id: string | null }>;
  if (!classroomCourses.length) return { ok: false, message: "The selected class could not be found." };

  if (role === "teacher" && !classroomCourses.some((course) => course.teacher_id === user.id)) {
    const courseIds = classroomCourses.map((course) => course.id);
    const { count } = await admin
      .from("teacher_assignments")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .in("course_id", courseIds)
      .is("deleted_at", null);
    if (!count) return { ok: false, message: "You can only record attendance for your assigned classes." };
  }

  const studentIds = submittedStatuses.map((item) => item.studentId);
  const { data: students } = await admin
    .from("students")
    .select("id,classroom_id")
    .in("id", studentIds)
    .eq("classroom_id", result.data.classroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const validIds = new Set(((students ?? []) as Array<{ id: string }>).map((student) => student.id));
  if (validIds.size !== submittedStatuses.length) return { ok: false, message: "Some students do not belong to the selected class." };
  const counts = submittedStatuses.reduce<Record<string, number>>((summary, item) => {
    summary[item.status] = (summary[item.status] ?? 0) + 1;
    summary.total = (summary.total ?? 0) + 1;
    return summary;
  }, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });

  const registerPayload = {
    classroom_id: result.data.classroomId,
    academic_year_id: classroomCourses[0]?.academic_year_id ?? null,
    attendance_date: result.data.attendanceDate,
    status: "submitted",
    submitted_by: user.id,
    submitted_at: new Date().toISOString(),
    locked_at: new Date().toISOString(),
    counts: counts as Json,
    metadata: {
      submitted_count: submittedStatuses.length,
      source: "bulk_attendance_form"
    } satisfies Json
  };
  let registerId = existingRegister?.id ?? "";
  if (registerId) {
    const { error: registerUpdateError } = await admin.from("attendance_registers").update(registerPayload).eq("id", registerId);
    if (registerUpdateError) return { ok: false, message: "The attendance register summary could not be updated." };
  } else {
    const { data: registerData, error: registerInsertError } = await admin.from("attendance_registers").insert(registerPayload).select("id").single();
    if (registerInsertError || !registerData) return { ok: false, message: "The attendance register summary could not be created." };
    registerId = String((registerData as { id: string }).id);
  }

  const { error: clearError } = await admin
    .from("attendance_records")
    .update({ deleted_at: new Date().toISOString() })
    .in("student_id", studentIds)
    .eq("classroom_id", result.data.classroomId)
    .eq("attendance_date", result.data.attendanceDate)
    .is("course_id", null);
  if (clearError) return { ok: false, message: "The existing register could not be refreshed." };

  const { error } = await admin.from("attendance_records").insert(submittedStatuses.map((item) => ({
    student_id: item.studentId,
    classroom_id: result.data.classroomId,
    course_id: null,
    attendance_date: result.data.attendanceDate,
    status: item.status,
    recorded_by: user.id,
    register_id: registerId
  })));

  if (error) return { ok: false, message: "The attendance register could not be saved." };
  if (Number(counts.absent ?? 0) > 0 || Number(counts.late ?? 0) > 2) {
    await createWorkflowTask({
      title: `Review attendance exceptions for ${result.data.attendanceDate}`,
      workflowKey: "attendance_follow_up",
      description: `${counts.absent ?? 0} absent and ${counts.late ?? 0} late record(s) were submitted. Contact guardians where needed and record any interventions.`,
      priority: Number(counts.absent ?? 0) > 2 ? "high" : "normal",
      dueAt: new Date(`${result.data.attendanceDate}T17:00:00`).toISOString(),
      assignedTo: user.id,
      createdBy: user.id,
      classroomId: result.data.classroomId,
      relatedTable: "attendance_registers",
      relatedRecordId: registerId,
      metadata: {
        attendance_date: result.data.attendanceDate,
        counts,
        source: "bulk_attendance_submission"
      } satisfies Json
    });
  }
  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "attendance.register_submitted");
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/parent");
  return { ok: true, message: `${submittedStatuses.length} attendance record${submittedStatuses.length === 1 ? "" : "s"} saved and the daily register was closed.` };
}
