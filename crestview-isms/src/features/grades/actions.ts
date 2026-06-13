"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSchema } from "@/lib/validations/grade.schema";
import type { Json } from "@/types/database.types";

const gradeScaleSchema = z.object({
  scaleId: z.string().uuid(),
  minPercentage: z.coerce.number().min(0).max(100),
  maxPercentage: z.coerce.number().min(0).max(100),
  remark: z.string().trim().min(2).max(120),
  isPassing: z.coerce.boolean()
}).refine((value) => value.maxPercentage >= value.minPercentage, "Max percentage must be greater than or equal to min percentage.");

const gradeItemSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  maxScore: z.coerce.number().min(1).max(1000),
  weight: z.coerce.number().min(0).max(1),
  dueDate: z.string().date().optional().or(z.literal("")),
  publishNow: z.coerce.boolean()
});

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function canManageGradeItem(userId: string, role: string, gradeItemId: string) {
  if (role === "super_admin" || role === "school_admin") return true;
  const admin = createAdminClient();
  const { data } = await admin
    .from("grade_items")
    .select("id,courses(id,teacher_id)")
    .eq("id", gradeItemId)
    .is("deleted_at", null)
    .maybeSingle();
  const record = data as unknown as { courses: { id: string; teacher_id: string | null } | { id: string; teacher_id: string | null }[] | null } | null;
  const course = one(record?.courses);
  if (!course) return false;
  if (course.teacher_id === userId) return true;
  const { count } = await admin
    .from("teacher_assignments")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", userId)
    .eq("course_id", course.id)
    .is("deleted_at", null);
  return Boolean(count);
}

async function canManageCourse(userId: string, role: string, courseId: string) {
  if (role === "super_admin" || role === "school_admin") return true;
  const admin = createAdminClient();
  const { data } = await admin.from("courses").select("id,teacher_id").eq("id", courseId).is("deleted_at", null).maybeSingle();
  const course = data as { id: string; teacher_id: string | null } | null;
  if (!course) return false;
  if (course.teacher_id === userId) return true;
  const { count } = await admin
    .from("teacher_assignments")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", userId)
    .eq("course_id", courseId)
    .is("deleted_at", null);
  return Boolean(count);
}

async function getGradeItemContext(gradeItemId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("grade_items")
    .select("id,max_score,course_id,courses(classroom_id,academic_year_id,term,subject_id,subjects(name))")
    .eq("id", gradeItemId)
    .is("deleted_at", null)
    .maybeSingle();
  const gradeItem = data as unknown as {
    id: string;
    max_score: number | null;
    course_id: string;
    courses: { classroom_id: string; academic_year_id: string | null; term: string; subject_id: string | null; subjects: { name: string } | { name: string }[] | null } | { classroom_id: string; academic_year_id: string | null; term: string; subject_id: string | null; subjects: { name: string } | { name: string }[] | null }[] | null;
  } | null;
  const course = one(gradeItem?.courses);
  return gradeItem && course
    ? {
        gradeItemId: gradeItem.id,
        courseId: gradeItem.course_id,
        maxScore: Number(gradeItem.max_score ?? 100),
        classroomId: course.classroom_id,
        academicYearId: course.academic_year_id,
        subjectId: course.subject_id,
        subjectName: one(course.subjects)?.name ?? "Subject",
        term: course.term
      }
    : null;
}

async function computeGrade(gradeItemId: string, score: number) {
  const admin = createAdminClient();
  const { data: gradeItemData } = await admin.from("grade_items").select("max_score").eq("id", gradeItemId).maybeSingle();
  const gradeItem = gradeItemData as { max_score: number | null } | null;
  const maxScore = Number(gradeItem?.max_score ?? 100);
  const percentage = maxScore > 0 ? Math.min(100, Math.max(0, (Number(score) / maxScore) * 100)) : 0;
  return computeGradeFromPercentage(percentage, maxScore);
}

async function computeGradeFromPercentage(percentageValue: number, maxScore = 100) {
  const admin = createAdminClient();
  const percentage = Math.min(100, Math.max(0, Number(percentageValue)));
  const { data: scaleData } = await admin
    .from("grading_scales")
    .select("id,code,remark,points")
    .lte("min_percentage", percentage)
    .gte("max_percentage", percentage)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const scale = scaleData as { id: string; code: string; remark: string; points: number | null } | null;
  return {
    percentage: Number(percentage.toFixed(2)),
    gradeCode: scale?.code ?? null,
    gradePoints: scale?.points ?? null,
    remark: scale?.remark ?? null,
    scaleId: scale?.id ?? null,
    maxScore
  };
}

function buildGradeAnalysis({
  assignment,
  quiz,
  midterm,
  classAssessment,
  exam,
  total,
  subject,
  remark
}: {
  assignment: number;
  quiz: number;
  midterm: number;
  classAssessment: number;
  exam: number;
  total: number;
  subject: string;
  remark: string | null;
}) {
  const strengths = [
    total >= 75 ? `Excellent overall performance in ${subject}.` : null,
    classAssessment >= 24 ? "Strong continuous assessment habits across assignments, quizzes, and mid-term work." : null,
    exam >= 56 ? "Strong end-of-term examination performance." : null
  ].filter(Boolean);
  const concerns = [
    assignment < 5 ? "Assignment completion or quality needs closer monitoring." : null,
    quiz < 5 ? "Class quiz performance shows gaps that should be revised quickly." : null,
    midterm < 5 ? "Mid-term score indicates the student needs earlier preparation support." : null,
    exam < 35 ? "End-of-term exam performance is below the expected benchmark." : null
  ].filter(Boolean);
  const recommendations = [
    total >= 75 ? "Maintain enrichment tasks and leadership opportunities in class." : null,
    total < 75 && total >= 50 ? "Use weekly revision targets and short practice exercises before the next assessment." : null,
    total < 50 ? "Schedule targeted remediation with parent follow-up and weekly progress checks." : null
  ].filter(Boolean);

  return {
    subject,
    remark,
    strengths,
    concerns,
    recommendations,
    breakdown: {
      assignment,
      quiz,
      midterm,
      classAssessment,
      exam,
      total
    }
  } satisfies Json;
}

export async function publishGradeAction(formData: FormData) {
  const result = gradeSchema.safeParse({
    gradeItemId: String(formData.get("gradeItemId") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    score: String(formData.get("score") ?? ""),
    comments: String(formData.get("comments") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the grade details." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const allowed = await canManageGradeItem(user.id, role, result.data.gradeItemId);
  if (!allowed) return { ok: false, message: "You can only grade assessments assigned to your class or subject." };

  const admin = createAdminClient();
  const context = await getGradeItemContext(result.data.gradeItemId);
  if (!context) return { ok: false, message: "The assessment is not linked to a class subject." };
  if (result.data.score > context.maxScore) return { ok: false, message: `Score cannot exceed the assessment max score of ${context.maxScore}.` };
  const { data: studentData } = await admin.from("students").select("classroom_id,status").eq("id", result.data.studentId).is("deleted_at", null).maybeSingle();
  const student = studentData as { classroom_id: string | null; status: string } | null;
  if (!student || student.status !== "active" || student.classroom_id !== context.classroomId) {
    return { ok: false, message: "The selected student does not belong to this assessment class." };
  }
  const computed = await computeGrade(result.data.gradeItemId, result.data.score);
  const { error } = await admin.from("grades").upsert({
    grade_item_id: result.data.gradeItemId,
    student_id: result.data.studentId,
    score: result.data.score,
    comments: result.data.comments?.trim() || computed.remark,
    graded_by: user.id,
    percentage: computed.percentage,
    grade_code: computed.gradeCode,
    grade_points: computed.gradePoints,
    remark: computed.remark,
    scale_id: computed.scaleId,
    total_score: computed.percentage,
    term_label: context.term
  }, { onConflict: "grade_item_id,student_id" });

  revalidatePath("/admin/grades");
  revalidatePath("/teacher/grades");
  revalidatePath("/student/grades");
  revalidatePath("/parent/children");
  return error
    ? { ok: false, message: "The grade could not be saved. Check the assessment, student, and your access level." }
    : { ok: true, message: "Grade saved." };
}

export async function createGradeItemAction(formData: FormData) {
  const result = gradeItemSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    maxScore: String(formData.get("maxScore") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    publishNow: String(formData.get("publishNow") ?? "false") === "true"
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the assessment setup." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const allowed = await canManageCourse(user.id, role, result.data.courseId);
  if (!allowed) return { ok: false, message: "You can only create assessments for assigned classes and subjects." };

  const admin = createAdminClient();
  const { error } = await admin.from("grade_items").insert({
    course_id: result.data.courseId,
    title: result.data.title,
    category: result.data.category,
    max_score: result.data.maxScore,
    weight: result.data.weight,
    due_date: result.data.dueDate || null,
    status: result.data.publishNow ? "open" : "draft",
    published_at: result.data.publishNow ? new Date().toISOString() : null,
    metadata: { created_from: "grade_item_form" } satisfies Json
  });

  revalidatePath("/admin/grades");
  revalidatePath("/teacher/grades");
  return error ? { ok: false, message: "The assessment could not be created." } : { ok: true, message: "Assessment created." };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[%()/.-]+/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findHeaderIndex(rows: string[][]) {
  return rows.findIndex((row) => row.map(normalizeHeader).some((header) => ["student_number", "student_id", "id"].includes(header)));
}

function indexOfHeader(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function readCell(row: string[], index: number) {
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}

function readScore(row: string[], index: number) {
  const raw = readCell(row, index);
  if (!raw || raw.startsWith("=")) return null;
  const value = Number(raw.replaceAll(",", "").replace("%", ""));
  return Number.isFinite(value) ? value : null;
}

function withinScore(value: number, max: number) {
  return value >= 0 && value <= max;
}

export async function importGradesCsvAction(formData: FormData) {
  const gradeItemId = String(formData.get("gradeItemId") ?? "");
  const file = formData.get("file");
  if (!z.string().uuid().safeParse(gradeItemId).success) return { ok: false, message: "Choose an assessment before importing." };
  if (!file || typeof file !== "object" || !("text" in file)) return { ok: false, message: "Choose a CSV file exported from the grade template." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const allowed = await canManageGradeItem(user.id, role, gradeItemId);
  if (!allowed) return { ok: false, message: "You can only import grades for assessments assigned to your class or subject." };

  const admin = createAdminClient();
  const text = await (file as File).text();
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, message: "The CSV file needs a header row and at least one student row." };

  const headerIndex = findHeaderIndex(rows);
  if (headerIndex < 0) return { ok: false, message: "The CSV must include a student_number header row." };

  const headers = rows[headerIndex].map(normalizeHeader);
  const studentNumberIndex = headers.findIndex((header) => ["student_number", "student_id", "id"].includes(header));
  const subjectIndex = indexOfHeader(headers, ["subject", "subject_course", "course"]);
  const assignmentIndex = indexOfHeader(headers, ["assignment_10", "assignment", "assignment_score"]);
  const quizIndex = indexOfHeader(headers, ["quiz_10", "class_quiz_10", "class_quizzes_10", "quiz", "quiz_score"]);
  const midtermIndex = indexOfHeader(headers, ["midterm_10", "mid_term_10", "midterm", "midterm_score", "mid_term_exam"]);
  const examIndex = indexOfHeader(headers, ["end_term_exam_70", "end_of_term_exam_70", "exam_70", "exam", "examination"]);
  const totalIndex = indexOfHeader(headers, ["total_100", "total", "total_score"]);
  const commentsIndex = headers.findIndex((header) => ["comments", "comment", "remarks", "remark", "teacher_comment"].includes(header));
  if (studentNumberIndex < 0 || assignmentIndex < 0 || quizIndex < 0 || midtermIndex < 0 || examIndex < 0) {
    return { ok: false, message: "The CSV must include student_number, assignment_10, quiz_10, midterm_10, and end_term_exam_70 columns." };
  }

  const context = await getGradeItemContext(gradeItemId);
  if (!context) return { ok: false, message: "The assessment is not linked to a classroom." };

  const { data: students } = await admin
    .from("students")
    .select("id,student_number")
    .eq("classroom_id", context.classroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const studentsByNumber = new Map(((students ?? []) as Array<{ id: string; student_number: string }>).map((student) => [student.student_number.toUpperCase(), student.id]));

  const gradeRows = [];
  const errors: string[] = [];
  for (const [index, row] of rows.slice(headerIndex + 1).entries()) {
    const rowNumber = headerIndex + index + 2;
    const studentNumber = String(row[studentNumberIndex] ?? "").trim().toUpperCase();
    if (!studentNumber) continue;
    const assignment = readScore(row, assignmentIndex);
    const quiz = readScore(row, quizIndex);
    const midterm = readScore(row, midtermIndex);
    const exam = readScore(row, examIndex);
    const studentId = studentsByNumber.get(studentNumber);
    if (!studentId) {
      errors.push(`Row ${rowNumber}: ${studentNumber || "missing student number"} was not found in this class.`);
      continue;
    }
    if (assignment === null || quiz === null || midterm === null || exam === null) {
      errors.push(`Row ${rowNumber}: fill assignment, quiz, midterm, and exam scores before importing.`);
      continue;
    }
    if (!withinScore(assignment, 10) || !withinScore(quiz, 10) || !withinScore(midterm, 10) || !withinScore(exam, 70)) {
      errors.push(`Row ${rowNumber}: scores must stay within assignment 10, quiz 10, midterm 10, and exam 70.`);
      continue;
    }
    const classAssessment = Number((assignment + quiz + midterm).toFixed(2));
    const total = Number((classAssessment + exam).toFixed(2));
    const uploadedTotal = readScore(row, totalIndex);
    if (uploadedTotal !== null && Math.abs(uploadedTotal - total) > 0.51) {
      errors.push(`Row ${rowNumber}: total_100 does not match the platform-calculated total.`);
      continue;
    }
    if (!withinScore(classAssessment, 30) || !withinScore(total, 100)) {
      errors.push(`Row ${rowNumber}: calculated assessment total is outside the required 30/70 structure.`);
      continue;
    }
    const subject = readCell(row, subjectIndex) || context.subjectName || "Subject";
    const computed = await computeGradeFromPercentage(total);
    gradeRows.push({
      grade_item_id: gradeItemId,
      student_id: studentId,
      score: total,
      comments: commentsIndex >= 0 ? String(row[commentsIndex] ?? "").trim() || computed.remark : computed.remark,
      graded_by: user.id,
      percentage: computed.percentage,
      grade_code: computed.gradeCode,
      grade_points: computed.gradePoints,
      remark: computed.remark,
      scale_id: computed.scaleId,
      assignment_score: assignment,
      quiz_score: quiz,
      midterm_score: midterm,
      class_assessment_score: classAssessment,
      exam_score: exam,
      total_score: total,
      subject_name: subject,
      term_label: context.term,
      analysis: buildGradeAnalysis({
        assignment,
        quiz,
        midterm,
        classAssessment,
        exam,
        total,
        subject,
        remark: computed.remark
      })
    });
  }

  if (gradeRows.length) {
    const { error } = await admin.from("grades").upsert(gradeRows, { onConflict: "grade_item_id,student_id" });
    if (error) return { ok: false, message: "The grade rows could not be saved." };
  }

  await admin.from("grade_import_batches").insert({
    course_id: context.courseId,
    grade_item_id: gradeItemId,
    classroom_id: context.classroomId,
    academic_year_id: context.academicYearId,
    subject_id: context.subjectId,
    term: context.term,
    uploaded_by: user.id,
    file_name: (file as File).name,
    status: errors.length && !gradeRows.length ? "failed" : "processed",
    rows_total: rows.length - headerIndex - 1,
    rows_success: gradeRows.length,
    rows_failed: errors.length,
    error_summary: errors.slice(0, 8).join(" "),
    metadata: {
      errors: errors.slice(0, 25),
      template: "crestview_30_70",
      expected_columns: ["assignment_10", "quiz_10", "midterm_10", "end_term_exam_70", "total_100", "grade", "remark"],
      class_assessment_max: 30,
      exam_max: 70,
      total_max: 100
    } satisfies Json
  });

  revalidatePath("/admin/grades");
  revalidatePath("/teacher/grades");
  revalidatePath("/student/grades");
  revalidatePath("/parent/children");
  revalidatePath("/admin/reports");
  revalidatePath("/student");
  revalidatePath("/parent");
  return {
    ok: errors.length === 0,
    message: `${gradeRows.length} grade row${gradeRows.length === 1 ? "" : "s"} imported${errors.length ? `; ${errors.length} row${errors.length === 1 ? "" : "s"} need review.` : "."}`
  };
}

export async function updateGradingScaleAction(formData: FormData) {
  const result = gradeScaleSchema.safeParse({
    scaleId: String(formData.get("scaleId") ?? ""),
    minPercentage: String(formData.get("minPercentage") ?? ""),
    maxPercentage: String(formData.get("maxPercentage") ?? ""),
    remark: String(formData.get("remark") ?? ""),
    isPassing: String(formData.get("isPassing") ?? "false") === "true"
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the grade scale row." };

  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { error } = await admin.from("grading_scales").update({
    min_percentage: result.data.minPercentage,
    max_percentage: result.data.maxPercentage,
    remark: result.data.remark,
    is_passing: result.data.isPassing
  }).eq("id", result.data.scaleId);

  revalidatePath("/admin/grades");
  return error ? { ok: false, message: "The grading scale could not be updated." } : { ok: true, message: "Grading scale updated." };
}
