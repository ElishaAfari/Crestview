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

async function computeGrade(gradeItemId: string, score: number) {
  const admin = createAdminClient();
  const { data: gradeItemData } = await admin.from("grade_items").select("max_score").eq("id", gradeItemId).maybeSingle();
  const gradeItem = gradeItemData as { max_score: number | null } | null;
  const maxScore = Number(gradeItem?.max_score ?? 100);
  const percentage = maxScore > 0 ? Math.min(100, Math.max(0, (Number(score) / maxScore) * 100)) : 0;
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
    scaleId: scale?.id ?? null
  };
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
    scale_id: computed.scaleId
  }, { onConflict: "grade_item_id,student_id" });

  revalidatePath("/admin/grades");
  revalidatePath("/teacher/grades");
  revalidatePath("/student/grades");
  revalidatePath("/parent/children");
  return error
    ? { ok: false, message: "The grade could not be saved. Check the assessment, student, and your access level." }
    : { ok: true, message: "Grade saved." };
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

  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"));
  const studentNumberIndex = headers.findIndex((header) => ["student_number", "student_id", "id"].includes(header));
  const scoreIndex = headers.findIndex((header) => ["score", "marks", "mark"].includes(header));
  const commentsIndex = headers.findIndex((header) => ["comments", "comment", "remarks", "remark"].includes(header));
  if (studentNumberIndex < 0 || scoreIndex < 0) {
    return { ok: false, message: "The CSV must include student_number and score columns." };
  }

  const { data: gradeItemData } = await admin.from("grade_items").select("id,course_id,courses(classroom_id)").eq("id", gradeItemId).maybeSingle();
  const gradeItem = gradeItemData as unknown as { course_id: string; courses: { classroom_id: string } | { classroom_id: string }[] | null } | null;
  const classroomId = one(gradeItem?.courses)?.classroom_id;
  if (!gradeItem || !classroomId) return { ok: false, message: "The assessment is not linked to a classroom." };

  const { data: students } = await admin
    .from("students")
    .select("id,student_number")
    .eq("classroom_id", classroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const studentsByNumber = new Map(((students ?? []) as Array<{ id: string; student_number: string }>).map((student) => [student.student_number.toUpperCase(), student.id]));

  const gradeRows = [];
  const errors: string[] = [];
  for (const [index, row] of rows.slice(1).entries()) {
    const studentNumber = String(row[studentNumberIndex] ?? "").trim().toUpperCase();
    const score = Number(row[scoreIndex]);
    const studentId = studentsByNumber.get(studentNumber);
    if (!studentId) {
      errors.push(`Row ${index + 2}: ${studentNumber || "missing student number"} was not found in this class.`);
      continue;
    }
    if (!Number.isFinite(score) || score < 0) {
      errors.push(`Row ${index + 2}: score is not valid.`);
      continue;
    }
    const computed = await computeGrade(gradeItemId, score);
    gradeRows.push({
      grade_item_id: gradeItemId,
      student_id: studentId,
      score,
      comments: commentsIndex >= 0 ? String(row[commentsIndex] ?? "").trim() || computed.remark : computed.remark,
      graded_by: user.id,
      percentage: computed.percentage,
      grade_code: computed.gradeCode,
      grade_points: computed.gradePoints,
      remark: computed.remark,
      scale_id: computed.scaleId
    });
  }

  if (gradeRows.length) {
    const { error } = await admin.from("grades").upsert(gradeRows, { onConflict: "grade_item_id,student_id" });
    if (error) return { ok: false, message: "The grade rows could not be saved." };
  }

  await admin.from("grade_import_batches").insert({
    course_id: gradeItem.course_id,
    grade_item_id: gradeItemId,
    uploaded_by: user.id,
    file_name: (file as File).name,
    status: errors.length && !gradeRows.length ? "failed" : "processed",
    rows_total: rows.length - 1,
    rows_success: gradeRows.length,
    rows_failed: errors.length,
    error_summary: errors.slice(0, 8).join(" "),
    metadata: { errors: errors.slice(0, 25) } satisfies Json
  });

  revalidatePath("/admin/grades");
  revalidatePath("/teacher/grades");
  revalidatePath("/student/grades");
  revalidatePath("/parent/children");
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
