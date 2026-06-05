"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const attendanceSchema = z.object({
  studentId: z.string().uuid(),
  classroomId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  attendanceDate: z.string().date(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().max(1000).optional()
});

const bulkAttendanceSchema = z.object({
  courseId: z.string().uuid(),
  attendanceDate: z.string().date()
});

const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);

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

export async function bulkRecordAttendanceAction(formData: FormData) {
  const result = bulkAttendanceSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
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
  const { data: course } = await admin
    .from("courses")
    .select("id,classroom_id,teacher_id")
    .eq("id", result.data.courseId)
    .is("deleted_at", null)
    .maybeSingle();
  const courseRecord = course as { id: string; classroom_id: string; teacher_id: string | null } | null;
  if (!courseRecord) return { ok: false, message: "The selected course could not be found." };

  if (role === "teacher" && courseRecord.teacher_id !== user.id) {
    const { count } = await admin
      .from("teacher_assignments")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .eq("course_id", courseRecord.id)
      .is("deleted_at", null);
    if (!count) return { ok: false, message: "You can only record attendance for your assigned courses." };
  }

  const studentIds = submittedStatuses.map((item) => item.studentId);
  const { data: students } = await admin
    .from("students")
    .select("id,classroom_id")
    .in("id", studentIds)
    .eq("classroom_id", courseRecord.classroom_id)
    .eq("status", "active")
    .is("deleted_at", null);
  const validIds = new Set(((students ?? []) as Array<{ id: string }>).map((student) => student.id));
  if (validIds.size !== submittedStatuses.length) return { ok: false, message: "Some students do not belong to the selected course classroom." };

  const { error } = await admin.from("attendance_records").upsert(submittedStatuses.map((item) => ({
    student_id: item.studentId,
    classroom_id: courseRecord.classroom_id,
    course_id: courseRecord.id,
    attendance_date: result.data.attendanceDate,
    status: item.status,
    recorded_by: user.id
  })), { onConflict: "student_id,attendance_date,course_id" });

  if (error) return { ok: false, message: "The attendance register could not be saved." };
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/parent");
  return { ok: true, message: `${submittedStatuses.length} attendance record${submittedStatuses.length === 1 ? "" : "s"} saved.` };
}
