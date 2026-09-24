"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ADMIN_ROLES } from "@/config/roles";
import { requireRoles } from "@/features/auth/guards";
import { canTeacherEditLessonNote, reviewStatusForDecision } from "@/features/lesson-notes/workflow";
import { createAdminClient } from "@/lib/supabase/admin";

export type LessonNoteActionState = { ok: boolean; message: string };

const lessonNoteSchema = z.object({
  planId: z.string().uuid().optional().or(z.literal("")),
  courseId: z.string().uuid(),
  schemeId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3, "Add a lesson title.").max(180),
  plannedFor: z.string().date(),
  objectives: z.string().trim().min(10, "Add at least one learning objective.").max(4000),
  activities: z.string().trim().min(10, "Describe the learning activities.").max(8000),
  lessonNote: z.string().trim().min(30, "Write the lesson note before saving.").max(24000),
  resources: z.string().trim().max(2000).optional(),
  homework: z.string().trim().max(2000).optional(),
  intent: z.enum(["draft", "submit"]),
});

const reviewSchema = z.object({
  planId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  comment: z.string().trim().max(4000),
});

const schemeSchema = z.object({
  schemeId: z.string().uuid().optional().or(z.literal("")),
  courseId: z.string().uuid(),
  weekNumber: z.coerce.number().int().min(1).max(16),
  topic: z.string().trim().min(3, "Add the weekly topic.").max(220),
  objectives: z.string().trim().max(4000).optional(),
  resources: z.string().trim().max(4000).optional(),
  status: z.enum(["planned", "active", "completed", "archived"]),
});

async function teacherCanUseCourse(courseId: string, teacherId: string) {
  const admin = createAdminClient();
  const [{ data: leadCourse }, { data: assignment }] = await Promise.all([
    admin.from("courses").select("id").eq("id", courseId).eq("teacher_id", teacherId).is("deleted_at", null).maybeSingle(),
    admin.from("teacher_assignments").select("id").eq("course_id", courseId).eq("teacher_id", teacherId).is("deleted_at", null).maybeSingle(),
  ]);
  return Boolean(leadCourse || assignment);
}

function revalidateLessonNotePaths() {
  revalidatePath("/teacher/lesson-notes");
  revalidatePath("/academics-office/lesson-notes");
  revalidatePath("/academics-office");
  revalidatePath("/teacher");
  revalidatePath("/admin");
}

function revalidateSchemePaths() {
  revalidatePath("/teacher/schemes");
  revalidatePath("/academics-office/schemes");
  revalidateLessonNotePaths();
}

export async function saveLessonNoteAction(
  _previous: LessonNoteActionState,
  formData: FormData,
): Promise<LessonNoteActionState> {
  const parsed = lessonNoteSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
    courseId: String(formData.get("courseId") ?? ""),
    schemeId: String(formData.get("schemeId") ?? ""),
    title: String(formData.get("title") ?? ""),
    plannedFor: String(formData.get("plannedFor") ?? ""),
    objectives: String(formData.get("objectives") ?? ""),
    activities: String(formData.get("activities") ?? ""),
    lessonNote: String(formData.get("lessonNote") ?? ""),
    resources: String(formData.get("resources") ?? ""),
    homework: String(formData.get("homework") ?? ""),
    intent: String(formData.get("intent") ?? "draft"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the lesson note." };
  const { user, role } = await requireRoles(["teacher", "super_admin", "school_admin"]);
  const admin = createAdminClient();
  const isAdmin = ADMIN_ROLES.includes(role);
  if (!isAdmin && !(await teacherCanUseCourse(parsed.data.courseId, user.id))) {
    return { ok: false, message: "You can only write lesson notes for a class and subject assigned to you." };
  }
  const objectiveList = parsed.data.objectives.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const submitting = parsed.data.intent === "submit";
  const payload = {
    course_id: parsed.data.courseId,
    scheme_id: parsed.data.schemeId || null,
    title: parsed.data.title,
    planned_for: parsed.data.plannedFor,
    objectives: objectiveList,
    activities: parsed.data.activities,
    lesson_note: parsed.data.lessonNote,
    homework: parsed.data.homework || null,
    review_status: submitting ? "submitted" : "draft",
    submitted_at: submitting ? new Date().toISOString() : null,
    review_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    status: submitting ? "ready" : "draft",
  };
  let planId = parsed.data.planId || null;
  if (planId) {
    const { data: existing } = await admin.from("lesson_plans").select("created_by,review_status,revision_number").eq("id", planId).is("deleted_at", null).maybeSingle();
    const existingRecord = existing as { created_by: string; review_status: "draft" | "submitted" | "approved" | "changes_requested"; revision_number: number } | null;
    if (!existingRecord) return { ok: false, message: "This lesson note is no longer available." };
    if (!isAdmin && (existingRecord.created_by !== user.id || !canTeacherEditLessonNote(existingRecord.review_status))) {
      return { ok: false, message: "This submitted or approved lesson note cannot be edited. Wait for a review decision." };
    }
    const { error } = await admin.from("lesson_plans").update({ ...payload, revision_number: Number(existingRecord.revision_number ?? 1) + 1 }).eq("id", planId);
    if (error) return { ok: false, message: "Could not update the lesson note. Please try again." };
  } else {
    const { data, error } = await admin.from("lesson_plans").insert({ ...payload, created_by: user.id }).select("id").single();
    if (error || !data) return { ok: false, message: "Could not save the lesson note. Please try again." };
    planId = String((data as { id: string }).id);
  }
  if (submitting && planId) {
    await admin.from("lesson_note_reviews").insert({ lesson_plan_id: planId, decision: "submitted", acted_by: user.id });
  }
  revalidateLessonNotePaths();
  return { ok: true, message: submitting ? "Lesson note submitted for review." : "Lesson note saved as a draft." };
}

export async function reviewLessonNoteAction(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });
  if (!parsed.success) return;
  if (parsed.data.decision === "changes_requested" && !parsed.data.comment) return;
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data: note } = await admin.from("lesson_plans").select("review_status").eq("id", parsed.data.planId).is("deleted_at", null).maybeSingle();
  if (!note || (note as { review_status: string }).review_status !== "submitted") return;
  const now = new Date().toISOString();
  const decision = reviewStatusForDecision(parsed.data.decision);
  await Promise.all([
    admin.from("lesson_plans").update({
      review_status: decision,
      status: parsed.data.decision === "approved" ? "ready" : "draft",
      reviewed_by: user.id,
      reviewed_at: now,
      review_comment: parsed.data.comment || null,
    }).eq("id", parsed.data.planId),
    admin.from("lesson_note_reviews").insert({
      lesson_plan_id: parsed.data.planId,
      decision: parsed.data.decision,
      comment: parsed.data.comment || null,
      acted_by: user.id,
    }),
  ]);
  revalidateLessonNotePaths();
}

export async function saveSchemeOfWorkAction(
  _previous: LessonNoteActionState,
  formData: FormData,
): Promise<LessonNoteActionState> {
  const parsed = schemeSchema.safeParse({
    schemeId: String(formData.get("schemeId") ?? ""),
    courseId: String(formData.get("courseId") ?? ""),
    weekNumber: String(formData.get("weekNumber") ?? ""),
    topic: String(formData.get("topic") ?? ""),
    objectives: String(formData.get("objectives") ?? ""),
    resources: String(formData.get("resources") ?? ""),
    status: String(formData.get("status") ?? "planned"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the scheme of work." };
  const { user, role } = await requireRoles(["teacher", "super_admin", "school_admin"]);
  const admin = createAdminClient();
  const isAdmin = ADMIN_ROLES.includes(role);
  if (!isAdmin && !(await teacherCanUseCourse(parsed.data.courseId, user.id))) {
    return { ok: false, message: "You can only create a scheme for a class and subject assigned to you." };
  }
  const { data: course } = await admin.from("courses").select("classroom_id,subject_id,term,classrooms(grade_level),subjects(name)").eq("id", parsed.data.courseId).is("deleted_at", null).maybeSingle();
  const courseRecord = course as { classroom_id: string; subject_id: string; term: string; classrooms: { grade_level: string } | { grade_level: string }[] | null; subjects: { name: string } | { name: string }[] | null } | null;
  if (!courseRecord) return { ok: false, message: "That course is no longer available." };
  const classroom = Array.isArray(courseRecord.classrooms) ? courseRecord.classrooms[0] : courseRecord.classrooms;
  const subject = Array.isArray(courseRecord.subjects) ? courseRecord.subjects[0] : courseRecord.subjects;
  const payload = {
    classroom_id: courseRecord.classroom_id,
    subject_id: courseRecord.subject_id,
    grade_level: classroom?.grade_level ?? "Class",
    subject_name: subject?.name ?? "Subject",
    term: courseRecord.term,
    week_number: parsed.data.weekNumber,
    topic: parsed.data.topic,
    objectives: parsed.data.objectives || null,
    resources: parsed.data.resources || null,
    status: parsed.data.status,
  };
  if (parsed.data.schemeId) {
    const { data: existing } = await admin.from("class_subject_schemes").select("created_by").eq("id", parsed.data.schemeId).is("deleted_at", null).maybeSingle();
    if (!existing) return { ok: false, message: "This scheme record is no longer available." };
    if (!isAdmin && (existing as { created_by: string | null }).created_by !== user.id) return { ok: false, message: "You can only edit a scheme you created." };
    const { error } = await admin.from("class_subject_schemes").update(payload).eq("id", parsed.data.schemeId);
    if (error) return { ok: false, message: "Could not update this scheme of work." };
  } else {
    const { data: duplicate } = await admin.from("class_subject_schemes").select("id").eq("classroom_id", payload.classroom_id).eq("subject_id", payload.subject_id).eq("term", payload.term).eq("week_number", payload.week_number).is("deleted_at", null).maybeSingle();
    if (duplicate) return { ok: false, message: "A scheme of work already exists for this class, subject, term, and week." };
    const { error } = await admin.from("class_subject_schemes").insert({ ...payload, created_by: user.id });
    if (error) return { ok: false, message: "Could not save this scheme of work." };
  }
  revalidateSchemePaths();
  return { ok: true, message: parsed.data.schemeId ? "Scheme of work updated." : "Scheme of work saved." };
}
