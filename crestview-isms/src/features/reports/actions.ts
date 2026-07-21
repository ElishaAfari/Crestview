"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createWorkflowTask } from "@/features/automation/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const reportSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  term: z.string().min(3),
  summary: z.string().min(10).max(2000)
});

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function gradeTotal(row: { total_score: number | null; percentage: number | null; score: number }) {
  return Number(row.total_score ?? row.percentage ?? row.score ?? 0);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function asPercent(value: number) {
  return `${Math.round(value)}%`;
}

function ordinal(value: number | null) {
  if (!value) return "Not ranked";
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

async function calculateClassRanking({
  admin,
  studentId,
  classroomId,
  academicYearId,
  term,
  currentRows
}: {
  admin: ReturnType<typeof createAdminClient>;
  studentId: string;
  classroomId: string | null;
  academicYearId: string;
  term: string;
  currentRows: Array<{ total: number }>;
}) {
  const currentTotal = currentRows.reduce((sum, row) => sum + row.total, 0);
  const currentSubjectCount = currentRows.length;
  if (!classroomId) {
    return {
      position: null,
      positionLabel: "Not ranked",
      classSize: 0,
      totalMarks: Number(currentTotal.toFixed(1)),
      average: currentSubjectCount ? Number((currentTotal / currentSubjectCount).toFixed(1)) : 0,
      subjectCount: currentSubjectCount
    };
  }

  const { data: classStudentsData } = await admin
    .from("students")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const classStudentIds = ((classStudentsData ?? []) as Array<{ id: string }>).map((student) => student.id);
  if (!classStudentIds.length) {
    return {
      position: null,
      positionLabel: "Not ranked",
      classSize: 0,
      totalMarks: Number(currentTotal.toFixed(1)),
      average: currentSubjectCount ? Number((currentTotal / currentSubjectCount).toFixed(1)) : 0,
      subjectCount: currentSubjectCount
    };
  }

  const { data: classGradesData } = await admin
    .from("grades")
    .select("student_id,score,percentage,total_score,term_label,grade_items(courses(term,academic_year_id,classroom_id))")
    .in("student_id", classStudentIds)
    .is("deleted_at", null);
  const classGrades = (classGradesData ?? []) as unknown as Array<{
    student_id: string;
    score: number;
    percentage: number | null;
    total_score: number | null;
    term_label: string | null;
    grade_items: Relation<{ courses: Relation<{ term: string | null; academic_year_id: string | null; classroom_id: string | null }> }>;
  }>;
  const requestedTerm = normalize(term);
  const totals = new Map<string, { studentId: string; total: number; subjectCount: number; average: number }>();
  for (const row of classGrades) {
    const course = one(one(row.grade_items)?.courses);
    if (course?.academic_year_id !== academicYearId || course?.classroom_id !== classroomId) continue;
    if (normalize(row.term_label ?? course.term ?? "") !== requestedTerm) continue;
    const current = totals.get(row.student_id) ?? { studentId: row.student_id, total: 0, subjectCount: 0, average: 0 };
    current.total += gradeTotal(row);
    current.subjectCount += 1;
    current.average = current.subjectCount ? current.total / current.subjectCount : 0;
    totals.set(row.student_id, current);
  }
  if (!totals.has(studentId) && currentSubjectCount) {
    totals.set(studentId, {
      studentId,
      total: currentTotal,
      subjectCount: currentSubjectCount,
      average: currentTotal / currentSubjectCount
    });
  }
  const ranked = Array.from(totals.values()).sort((a, b) => b.total - a.total || b.average - a.average || a.studentId.localeCompare(b.studentId));
  const targetIndex = ranked.findIndex((row) => row.studentId === studentId);
  const position = targetIndex >= 0 ? targetIndex + 1 : null;
  const target = targetIndex >= 0 ? ranked[targetIndex] : totals.get(studentId);

  return {
    position,
    positionLabel: ordinal(position),
    classSize: classStudentIds.length,
    totalMarks: Number((target?.total ?? currentTotal).toFixed(1)),
    average: Number((target?.average ?? (currentSubjectCount ? currentTotal / currentSubjectCount : 0)).toFixed(1)),
    subjectCount: target?.subjectCount ?? currentSubjectCount
  };
}

function buildAcademicAnalysis({
  grades,
  attendance
}: {
  grades: Array<{ subject: string; total: number; gradeCode: string | null; remark: string | null; comments: string | null }>;
  attendance: { total: number; present: number; late: number; absent: number; excused: number; rate: number };
}) {
  const average = grades.length ? grades.reduce((sum, row) => sum + row.total, 0) / grades.length : 0;
  const strengths = grades
    .filter((row) => row.total >= 75)
    .slice(0, 4)
    .map((row) => `${row.subject}: ${row.gradeCode ?? "A1"} (${asPercent(row.total)})`);
  const concerns = grades
    .filter((row) => row.total < 50)
    .slice(0, 4)
    .map((row) => `${row.subject}: ${row.gradeCode ?? "Below benchmark"} (${asPercent(row.total)})`);
  const recommendations = [
    average >= 75 ? "Continue enrichment activities, leadership tasks, and higher-order practice." : null,
    average < 75 && average >= 50 ? "Maintain weekly revision goals and short practice exercises for subjects below A/B range." : null,
    average < 50 ? "Create a focused intervention plan with weekly teacher-parent check-ins." : null,
    attendance.rate < 90 ? "Improve attendance consistency because learning gaps are likely to widen with missed lessons." : null,
    attendance.late > 2 ? "Strengthen punctuality routines so the learner starts lessons settled and prepared." : null
  ].filter(Boolean);

  return {
    average: Number(average.toFixed(1)),
    strengths: strengths.length ? strengths : ["Steady participation recorded; continue monitoring subject-level growth."],
    concerns: concerns.length ? concerns : ["No critical academic concern recorded for this term."],
    recommendations: recommendations.length ? recommendations : ["Maintain the current learning routine and review progress every two weeks."],
    attitude: average >= 70 ? "Positive learning attitude with good academic engagement." : "Developing learning attitude; benefits from consistent guidance and revision routines.",
    punctuality: attendance.rate >= 95 && attendance.late === 0 ? "Excellent punctuality and attendance." : attendance.rate >= 85 ? "Generally punctual with room for tighter attendance consistency." : "Attendance and punctuality require immediate support.",
    nextSteps: average >= 75 ? "Provide extension work and keep monitoring balanced growth across subjects." : "Agree on subject-specific practice targets before the next assessment window."
  };
}

export async function generateReportAction(formData: FormData) {
  const result = reportSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    academicYearId: String(formData.get("academicYearId") ?? ""),
    term: String(formData.get("term") ?? ""),
    summary: String(formData.get("summary") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the report details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();

  const { data: studentData } = await admin
    .from("students")
    .select("id,student_number,profile_id,classroom_id,profiles!students_profile_id_fkey(first_name,last_name),classrooms(name,grade_level)")
    .eq("id", result.data.studentId)
    .is("deleted_at", null)
    .maybeSingle();
  const student = studentData as unknown as {
    id: string;
    student_number: string;
    profile_id: string;
    classroom_id: string | null;
    profiles: Relation<{ first_name: string; last_name: string }>;
    classrooms: Relation<{ name: string; grade_level: string }>;
  } | null;
  if (!student) return { ok: false, message: "The selected student could not be found." };

  const [academicYearResult, gradeResult, attendanceResult, parentLinksResult] = await Promise.all([
    admin.from("academic_years").select("id,name,start_date,end_date").eq("id", result.data.academicYearId).maybeSingle(),
    admin
      .from("grades")
      .select("id,score,percentage,total_score,grade_code,remark,comments,assignment_score,quiz_score,midterm_score,class_assessment_score,exam_score,subject_name,term_label,grade_items(title,courses(term,academic_year_id,classroom_id,subjects(name)))")
      .eq("student_id", result.data.studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    admin.from("attendance_records").select("status,attendance_date").eq("student_id", result.data.studentId).is("deleted_at", null),
    admin.from("parent_students").select("parent_profile_id").eq("student_id", result.data.studentId).is("deleted_at", null)
  ]);
  const academicYear = academicYearResult.data as { id: string; name: string; start_date: string; end_date: string } | null;
  const gradeRowsRaw = (gradeResult.data ?? []) as unknown as Array<{
    id: string;
    score: number;
    percentage: number | null;
    total_score: number | null;
    grade_code: string | null;
    remark: string | null;
    comments: string | null;
    assignment_score: number | null;
    quiz_score: number | null;
    midterm_score: number | null;
    class_assessment_score: number | null;
    exam_score: number | null;
    subject_name: string | null;
    term_label: string | null;
    grade_items: Relation<{ title: string; courses: Relation<{ term: string; academic_year_id: string | null; classroom_id: string | null; subjects: Relation<{ name: string }> }> }>;
  }>;
  const requestedTerm = normalize(result.data.term);
  const matchingGrades = gradeRowsRaw.filter((row) => {
    const course = one(one(row.grade_items)?.courses);
    const sameTerm = normalize(row.term_label ?? course?.term ?? "") === requestedTerm;
    const sameAcademicYear = !course?.academic_year_id || course.academic_year_id === result.data.academicYearId;
    const sameClassroom = !course?.classroom_id || !student.classroom_id || course.classroom_id === student.classroom_id;
    return sameTerm && sameAcademicYear && sameClassroom;
  });
  const gradeRows = (matchingGrades.length ? matchingGrades : gradeRowsRaw).map((row) => {
    const course = one(one(row.grade_items)?.courses);
    const subject = row.subject_name ?? one(course?.subjects)?.name ?? one(row.grade_items)?.title ?? "Subject";
    return {
      id: row.id,
      subject,
      assignment: Number(row.assignment_score ?? 0),
      quiz: Number(row.quiz_score ?? 0),
      midterm: Number(row.midterm_score ?? 0),
      classAssessment: Number(row.class_assessment_score ?? 0),
      exam: Number(row.exam_score ?? 0),
      total: gradeTotal(row),
      gradeCode: row.grade_code,
      remark: row.remark,
      comments: row.comments
    };
  });
  const attendanceRows = (attendanceResult.data ?? []) as Array<{ status: string; attendance_date: string }>;
  const boundedAttendance = academicYear
    ? attendanceRows.filter((row) => row.attendance_date >= academicYear.start_date && row.attendance_date <= academicYear.end_date)
    : attendanceRows;
  const attendance = {
    total: boundedAttendance.length,
    present: boundedAttendance.filter((row) => row.status === "present").length,
    late: boundedAttendance.filter((row) => row.status === "late").length,
    absent: boundedAttendance.filter((row) => row.status === "absent").length,
    excused: boundedAttendance.filter((row) => row.status === "excused").length,
    rate: boundedAttendance.length
      ? Math.round(((boundedAttendance.filter((row) => row.status === "present" || row.status === "late").length) / boundedAttendance.length) * 100)
      : 0
  };
  const analysis = buildAcademicAnalysis({
    grades: gradeRows.map((row) => ({ subject: row.subject, total: row.total, gradeCode: row.gradeCode, remark: row.remark, comments: row.comments })),
    attendance
  });
  const ranking = await calculateClassRanking({
    admin,
    studentId: student.id,
    classroomId: student.classroom_id,
    academicYearId: result.data.academicYearId,
    term: result.data.term.trim(),
    currentRows: gradeRows
  });
  const classroom = one(student.classrooms);
  const profile = one(student.profiles);
  const studentName = profile ? `${profile.first_name} ${profile.last_name}` : student.student_number;

  const { data: reportData, error } = await admin.from("reports").insert({
    student_id: result.data.studentId,
    academic_year_id: result.data.academicYearId,
    term: result.data.term.trim(),
    summary: result.data.summary.trim(),
    generated_by: user.id,
    classroom_id: student.classroom_id,
    status: "published",
    published_at: new Date().toISOString(),
    grade_summary: {
      student: studentName,
      student_number: student.student_number,
      classroom: classroom ? `${classroom.grade_level} - ${classroom.name}` : "Unassigned",
      academic_year: academicYear?.name ?? "Academic year",
      term: result.data.term.trim(),
      average: analysis.average,
      total_marks: ranking.totalMarks,
      position: ranking.position,
      position_label: ranking.positionLabel,
      class_size: ranking.classSize,
      ranked_subjects: ranking.subjectCount,
      ranking_basis: "Sum of total /100 marks across all recorded subjects in the class for this term.",
      rows: gradeRows
    } satisfies Json,
    attendance_summary: attendance satisfies Json,
    analysis: {
      ...analysis,
      totalMarks: ranking.totalMarks,
      classPosition: ranking.position,
      positionLabel: ranking.positionLabel,
      classSize: ranking.classSize,
      rankedSubjects: ranking.subjectCount
    } satisfies Json,
    attitude: analysis.attitude,
    punctuality: analysis.punctuality,
    next_steps: analysis.nextSteps,
    metadata: {
      generated_from: "report_suite",
      report_standard: "crestview_30_70",
      grade_count: gradeRows.length,
      class_position: ranking.position,
      class_size: ranking.classSize
    } satisfies Json
  }).select("id").single();

  if (error) return { ok: false, message: "The report could not be generated." };
  const reportId = (reportData as { id: string } | null)?.id;
  if (reportId) {
    await admin.from("reports").update({ report_url: `/api/reports/${reportId}/pdf` }).eq("id", reportId);
  }
  const recipients = Array.from(new Set([
    student.profile_id,
    ...((parentLinksResult.data ?? []) as Array<{ parent_profile_id: string }>).map((link) => link.parent_profile_id)
  ].filter(Boolean)));
  if (recipients.length) {
    await admin.from("notifications").insert(recipients.map((recipientId) => ({
      recipient_id: recipientId,
      title: "Academic report published",
      body: `${studentName}'s ${result.data.term.trim()} report is ready to review.`,
      type: "report",
      metadata: { report_id: reportId, student_id: student.id } satisfies Json
    })));
  }
  if (reportId) {
    await createWorkflowTask({
      title: `Review report follow-up for ${studentName}`,
      workflowKey: "academic_follow_up",
      description: analysis.nextSteps,
      priority: analysis.average < 50 || attendance.rate < 85 ? "high" : "normal",
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: user.id,
      createdBy: user.id,
      studentId: student.id,
      classroomId: student.classroom_id,
      relatedTable: "reports",
      relatedRecordId: reportId,
      metadata: {
        average: analysis.average,
        attendance_rate: attendance.rate,
        term: result.data.term.trim(),
        recommendations: analysis.recommendations
      } satisfies Json
    });
    await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "report.published");
  }
  revalidatePath("/admin/reports");
  revalidatePath("/student");
  revalidatePath("/student/grades");
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  return { ok: true, message: "Report generated, published, and shared with the linked student and parent workspaces." };
}
