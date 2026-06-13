"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkflowTask } from "@/features/automation/actions";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const analyticsSchema = z.object({
  term: z.string().trim().min(2).max(40).optional()
});

type Student360Snapshot = {
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  classroom_id: string | null;
  classroom_name: string | null;
  grade_level: string | null;
  attendance_rate: number | null;
  attendance_rate_30_days: number | null;
  grade_average: number | null;
  low_grade_count: number | null;
  open_invoice_count: number | null;
  open_invoice_amount: number | null;
  overdue_invoice_count: number | null;
  note_count: number | null;
  risk_level: "green" | "amber" | "red";
};

function recommendationFor(row: Student360Snapshot) {
  const recommendations: string[] = [];
  if (Number(row.attendance_rate_30_days ?? row.attendance_rate ?? 0) < 85) recommendations.push("Schedule attendance follow-up with guardian and class teacher.");
  if (Number(row.low_grade_count ?? 0) > 0 || Number(row.grade_average ?? 0) < 60) recommendations.push("Prepare targeted academic support plan for weak subject areas.");
  if (Number(row.overdue_invoice_count ?? 0) > 0 || Number(row.open_invoice_amount ?? 0) > 0) recommendations.push("Coordinate finance communication with the linked parent account.");
  if (!recommendations.length) recommendations.push("Maintain current support rhythm and monitor next weekly refresh.");
  return recommendations;
}

function strengthsFor(row: Student360Snapshot) {
  const strengths: string[] = [];
  if (Number(row.attendance_rate ?? 0) >= 90) strengths.push("Strong attendance consistency.");
  if (Number(row.grade_average ?? 0) >= 75) strengths.push("Healthy academic average.");
  if (Number(row.open_invoice_count ?? 0) === 0) strengths.push("No open finance exposure.");
  return strengths.length ? strengths : ["Learner has enough data for continued monitoring."];
}

function concernsFor(row: Student360Snapshot) {
  const concerns: string[] = [];
  if (Number(row.attendance_rate_30_days ?? row.attendance_rate ?? 0) < 85) concerns.push("Attendance trend needs attention.");
  if (Number(row.low_grade_count ?? 0) > 0) concerns.push(`${row.low_grade_count} low grade item${Number(row.low_grade_count) === 1 ? "" : "s"} recorded.`);
  if (Number(row.overdue_invoice_count ?? 0) > 0) concerns.push("Overdue invoice risk exists.");
  if (row.risk_level === "amber" && !concerns.length) concerns.push("Mixed indicators require routine monitoring.");
  return concerns;
}

export async function refreshAnalyticsAction(formData?: FormData) {
  const parsed = analyticsSchema.safeParse({
    term: String(formData?.get("term") ?? "Term 1")
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Choose a valid term." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff"]);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: yearData } = await admin
    .from("academic_years")
    .select("id")
    .lte("start_date", today)
    .gte("end_date", today)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const academicYear = yearData as { id: string } | null;

  let classroomIds: string[] | null = null;
  if (role === "teacher") {
    const [leadCourses, assignedCourses] = await Promise.all([
      admin.from("courses").select("classroom_id").eq("teacher_id", user.id).is("deleted_at", null),
      admin.from("teacher_assignments").select("courses(classroom_id)").eq("teacher_id", user.id).is("deleted_at", null)
    ]);
    classroomIds = Array.from(new Set([
      ...((leadCourses.data ?? []) as Array<{ classroom_id: string | null }>).map((course) => course.classroom_id),
      ...((assignedCourses.data ?? []) as unknown as Array<{ courses: { classroom_id: string | null } | { classroom_id: string | null }[] | null }>).map((row) => {
        const course = Array.isArray(row.courses) ? row.courses[0] ?? null : row.courses;
        return course?.classroom_id ?? null;
      })
    ].filter((id): id is string => Boolean(id))));
    if (!classroomIds.length) return { ok: false, message: "No assigned classes are available for your analytics refresh." };
  }

  let overviewQuery = admin
    .from("student_360_overview")
    .select("student_id,student_number,first_name,last_name,classroom_id,classroom_name,grade_level,attendance_rate,attendance_rate_30_days,grade_average,low_grade_count,open_invoice_count,open_invoice_amount,overdue_invoice_count,note_count,risk_level")
    .limit(500);
  if (classroomIds) overviewQuery = overviewQuery.in("classroom_id", classroomIds);
  const { data, error } = await overviewQuery;
  if (error) return { ok: false, message: "Student intelligence data could not be loaded." };

  const rows = (data ?? []) as unknown as Student360Snapshot[];
  if (!rows.length) return { ok: false, message: "No learner records are available for analytics refresh." };

  const { error: insertError } = await admin.from("ai_analytics").insert(rows.map((row) => ({
    student_id: row.student_id,
    academic_year_id: academicYear?.id ?? null,
    term: parsed.data.term ?? "Term 1",
    risk_level: row.risk_level,
    strengths: strengthsFor(row),
    concerns: concernsFor(row),
    recommendations: recommendationFor(row),
    generated_at: new Date().toISOString()
  })));
  if (insertError) return { ok: false, message: "Analytics snapshots could not be saved." };

  const atRiskRows = rows.filter((row) => row.risk_level === "red" || row.risk_level === "amber");
  const { data: existingTasks } = atRiskRows.length
    ? await admin
        .from("workflow_tasks")
        .select("student_id")
        .eq("workflow_key", "student_intelligence_follow_up")
        .in("student_id", atRiskRows.map((row) => row.student_id))
        .in("status", ["open", "in_progress", "blocked"])
        .is("deleted_at", null)
    : { data: [] };
  const existingTaskStudents = new Set(((existingTasks ?? []) as Array<{ student_id: string | null }>).map((task) => task.student_id).filter(Boolean));

  for (const row of atRiskRows.slice(0, 50)) {
    if (existingTaskStudents.has(row.student_id)) continue;
    await createWorkflowTask({
      title: `${row.first_name} ${row.last_name} learner support review`,
      workflowKey: "student_intelligence_follow_up",
      description: recommendationFor(row).join(" "),
      priority: row.risk_level === "red" ? "urgent" : "high",
      createdBy: user.id,
      studentId: row.student_id,
      classroomId: row.classroom_id,
      relatedTable: "ai_analytics",
      metadata: {
        source: "student_360_analytics_refresh",
        risk_level: row.risk_level,
        attendance_rate: row.attendance_rate,
        grade_average: row.grade_average,
        open_invoice_amount: row.open_invoice_amount
      } satisfies Json
    });
  }

  await Promise.all([
    admin.from("system_jobs").insert({
      job_type: "student_360_analytics_refresh",
      status: "succeeded",
      payload: { term: parsed.data.term ?? "Term 1" } satisfies Json,
      result: {
        learners: rows.length,
        red: rows.filter((row) => row.risk_level === "red").length,
        amber: rows.filter((row) => row.risk_level === "amber").length,
        green: rows.filter((row) => row.risk_level === "green").length
      } satisfies Json,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    }),
    admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "student_360_analytics_refresh"),
    admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "REFRESH ai_analytics",
      table_name: "ai_analytics",
      record_id: null,
      after: { learners: rows.length, at_risk: atRiskRows.length, term: parsed.data.term ?? "Term 1" } satisfies Json
    })
  ]);

  revalidatePath("/admin/student-360");
  revalidatePath("/teacher/student-360");
  revalidatePath("/admin/automation");
  revalidatePath("/admin/reports");
  return { ok: true, message: `${rows.length} learner analytics snapshot${rows.length === 1 ? "" : "s"} refreshed with ${atRiskRows.length} support flag${atRiskRows.length === 1 ? "" : "s"}.` };
}
