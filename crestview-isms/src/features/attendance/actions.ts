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
