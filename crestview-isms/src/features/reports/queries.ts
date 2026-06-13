import "server-only";

import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numeric(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export type ReportDetail = {
  id: string;
  student: string;
  studentNumber: string;
  classroom: string;
  academicYear: string;
  term: string;
  summary: string;
  status: string;
  createdAt: string;
  publishedAt: string;
  downloadUrl: string;
  attendance: { total: number; present: number; late: number; absent: number; excused: number; rate: number };
  analysis: { average: number; strengths: string[]; concerns: string[]; recommendations: string[]; attitude: string; punctuality: string; nextSteps: string };
  gradeRows: Array<{ subject: string; classAssessment: number; exam: number; total: number; gradeCode: string; remark: string; comments: string }>;
};

async function canReadReport(userId: string, roleName: string, report: { student_id: string | null; classroom_id: string | null; students: Relation<{ profile_id: string | null }> }) {
  if (["super_admin", "school_admin"].includes(roleName)) return true;
  const admin = createAdminClient();
  const student = one(report.students);
  if (roleName === "student" && student?.profile_id === userId) return true;
  if (roleName === "parent" && report.student_id) {
    const { count } = await admin
      .from("parent_students")
      .select("*", { count: "exact", head: true })
      .eq("parent_profile_id", userId)
      .eq("student_id", report.student_id)
      .is("deleted_at", null);
    return Boolean(count);
  }
  if (roleName === "teacher" && report.classroom_id) {
    const [leadCourses, assignedCourses] = await Promise.all([
      admin
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", userId)
        .eq("classroom_id", report.classroom_id)
        .is("deleted_at", null),
      admin
        .from("teacher_assignments")
        .select("courses!inner(classroom_id)", { count: "exact", head: true })
        .eq("teacher_id", userId)
        .eq("courses.classroom_id", report.classroom_id)
        .is("deleted_at", null)
    ]);
    return Boolean((leadCourses.count ?? 0) + (assignedCourses.count ?? 0));
  }
  return false;
}

export async function getReportDetail(reportId: string): Promise<ReportDetail | null> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "student", "parent"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("reports")
    .select("id,term,summary,status,report_url,created_at,published_at,analysis,attendance_summary,grade_summary,attitude,punctuality,next_steps,student_id,classroom_id,students(profile_id,student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
    .eq("id", reportId)
    .is("deleted_at", null)
    .maybeSingle();
  const report = data as unknown as {
    id: string;
    term: string;
    summary: string | null;
    status: string | null;
    report_url: string | null;
    created_at: string | null;
    published_at: string | null;
    analysis: unknown;
    attendance_summary: unknown;
    grade_summary: unknown;
    attitude: string | null;
    punctuality: string | null;
    next_steps: string | null;
    student_id: string | null;
    classroom_id: string | null;
    students: Relation<{ profile_id: string | null; student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>;
    academic_years: Relation<{ name: string }>;
  } | null;

  if (!report) return null;
  if (!(await canReadReport(user.id, role ?? "", report))) return null;

  const student = one(report.students);
  const profile = one(student?.profiles);
  const gradeSummary = asRecord(report.grade_summary);
  const analysis = asRecord(report.analysis);
  const attendance = asRecord(report.attendance_summary);

  return {
    id: report.id,
    student: text(gradeSummary.student, profile ? `${profile.first_name} ${profile.last_name}` : "Student"),
    studentNumber: student?.student_number ?? text(gradeSummary.student_number, "N/A"),
    classroom: text(gradeSummary.classroom, "Unassigned"),
    academicYear: one(report.academic_years)?.name ?? text(gradeSummary.academic_year, "Academic year"),
    term: report.term,
    summary: report.summary ?? "No teacher summary recorded.",
    status: report.status ?? "draft",
    createdAt: formatDate(report.created_at),
    publishedAt: formatDate(report.published_at),
    downloadUrl: report.report_url ?? `/api/reports/${report.id}/pdf`,
    attendance: {
      total: numeric(attendance.total),
      present: numeric(attendance.present),
      late: numeric(attendance.late),
      absent: numeric(attendance.absent),
      excused: numeric(attendance.excused),
      rate: numeric(attendance.rate)
    },
    analysis: {
      average: numeric(analysis.average),
      strengths: asArray(analysis.strengths).map((item) => text(item)).filter((item) => item !== "-"),
      concerns: asArray(analysis.concerns).map((item) => text(item)).filter((item) => item !== "-"),
      recommendations: asArray(analysis.recommendations).map((item) => text(item)).filter((item) => item !== "-"),
      attitude: report.attitude ?? text(analysis.attitude, "Not recorded"),
      punctuality: report.punctuality ?? text(analysis.punctuality, "Not recorded"),
      nextSteps: report.next_steps ?? text(analysis.nextSteps, "Review progress with the class teacher.")
    },
    gradeRows: asArray(gradeSummary.rows).map((item) => {
      const row = asRecord(item);
      return {
        subject: text(row.subject, "Subject"),
        classAssessment: numeric(row.classAssessment),
        exam: numeric(row.exam),
        total: numeric(row.total),
        gradeCode: text(row.gradeCode),
        remark: text(row.remark),
        comments: text(row.comments, "")
      };
    })
  };
}
