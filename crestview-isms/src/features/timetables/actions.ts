"use server";

import { revalidatePath } from "next/cache";
import { createWorkflowTask } from "@/features/automation/actions";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

type TimetableRow = {
  id: string;
  classroom_id: string;
  course_id: string;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room_number: string | null;
  academic_year_id: string | null;
  courses: { teacher_id: string | null; subjects: { name: string } | { name: string }[] | null } | { teacher_id: string | null; subjects: { name: string } | { name: string }[] | null }[] | null;
  classrooms: { name: string; grade_level: string } | { name: string; grade_level: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function timeMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function overlaps(left: TimetableRow, right: TimetableRow) {
  return timeMinutes(left.starts_at) < timeMinutes(right.ends_at) && timeMinutes(right.starts_at) < timeMinutes(left.ends_at);
}

function label(row: TimetableRow) {
  const classroom = one(row.classrooms);
  const course = one(row.courses);
  const subject = one(course?.subjects);
  return `${classroom?.grade_level ?? "Class"} ${classroom?.name ?? ""} ${subject?.name ?? "Course"} ${row.starts_at}-${row.ends_at}`.trim();
}

export async function optimizeTimetableAction() {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  let permittedCourseIds: Set<string> | null = null;
  if (role === "teacher") {
    const [leadCourses, assignedCourses] = await Promise.all([
      admin.from("courses").select("id").eq("teacher_id", user.id).is("deleted_at", null),
      admin.from("teacher_assignments").select("course_id").eq("teacher_id", user.id).is("deleted_at", null)
    ]);
    permittedCourseIds = new Set([
      ...((leadCourses.data ?? []) as Array<{ id: string }>).map((course) => course.id),
      ...((assignedCourses.data ?? []) as Array<{ course_id: string }>).map((assignment) => assignment.course_id)
    ]);
    if (!permittedCourseIds.size) return { ok: false, message: "No assigned timetable records are available for your workspace." };
  }
  const { data, error } = await admin
    .from("timetables")
    .select("id,classroom_id,course_id,day_of_week,starts_at,ends_at,room_number,academic_year_id,courses(teacher_id,subjects(name)),classrooms(name,grade_level)")
    .is("deleted_at", null)
    .limit(800);
  if (error) return { ok: false, message: "Timetable records could not be scanned." };

  const rows = ((data ?? []) as unknown as TimetableRow[]).filter((row) => !permittedCourseIds || permittedCourseIds.has(row.course_id));
  const conflicts: Array<{ type: string; left: string; right: string; day: number }> = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const left = rows[i];
      const right = rows[j];
      if (left.day_of_week !== right.day_of_week || !overlaps(left, right)) continue;
      if (left.academic_year_id && right.academic_year_id && left.academic_year_id !== right.academic_year_id) continue;
      const leftTeacher = one(left.courses)?.teacher_id;
      const rightTeacher = one(right.courses)?.teacher_id;
      if (left.classroom_id === right.classroom_id) conflicts.push({ type: "classroom_overlap", left: label(left), right: label(right), day: left.day_of_week });
      if (leftTeacher && leftTeacher === rightTeacher) conflicts.push({ type: "teacher_overlap", left: label(left), right: label(right), day: left.day_of_week });
      if (left.room_number && right.room_number && left.room_number === right.room_number) conflicts.push({ type: "room_overlap", left: label(left), right: label(right), day: left.day_of_week });
    }
  }

  const limitedConflicts = conflicts.slice(0, 30);
  const { data: jobData } = await admin
    .from("system_jobs")
    .insert({
      job_type: "timetable_conflict_scan",
      status: "succeeded",
      payload: { scanned_records: rows.length } satisfies Json,
      result: { conflict_count: conflicts.length, conflicts: limitedConflicts } satisfies Json,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    })
    .select("id")
    .single();
  const job = jobData as { id: string } | null;

  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "timetable_conflict_scan");
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "SCAN timetables",
    table_name: "timetables",
    record_id: null,
    after: { scanned_records: rows.length, conflict_count: conflicts.length } satisfies Json
  });

  if (conflicts.length && job?.id) {
    await createWorkflowTask({
      title: `${conflicts.length} timetable conflict${conflicts.length === 1 ? "" : "s"} need review`,
      workflowKey: "timetable_conflict_resolution",
      description: limitedConflicts.map((conflict) => `${conflict.type.replaceAll("_", " ")}: ${conflict.left} / ${conflict.right}`).join("\n"),
      priority: "high",
      createdBy: user.id,
      relatedTable: "system_jobs",
      relatedRecordId: job.id,
      metadata: { source: "timetable_conflict_scan", conflict_count: conflicts.length } satisfies Json
    });
  }

  revalidatePath("/admin/automation");
  revalidatePath("/teacher");
  return {
    ok: conflicts.length === 0,
    message: conflicts.length
      ? `${conflicts.length} timetable conflict${conflicts.length === 1 ? "" : "s"} found and sent to Automation Center.`
      : `Timetable scan complete. ${rows.length} records checked with no conflicts.`
  };
}
