import "server-only";

import { ADMIN_ROLES } from "@/config/roles";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LessonNoteReviewStatus } from "@/features/lesson-notes/workflow";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export type LessonNoteCourse = {
  id: string;
  classroomId: string;
  subjectId: string;
  label: string;
};

export type LessonNoteScheme = {
  id: string;
  courseId: string;
  label: string;
};

export type LessonNoteRecord = {
  id: string;
  title: string;
  courseId: string;
  courseLabel: string;
  schemeId: string | null;
  schemeLabel: string | null;
  plannedFor: string | null;
  objectives: string[];
  activities: string;
  lessonNote: string;
  resources: string;
  homework: string;
  reviewStatus: LessonNoteReviewStatus;
  reviewComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  author: string;
  reviewer: string | null;
  revisionNumber: number;
};

export type LessonNoteReview = {
  id: string;
  lessonPlanId: string;
  decision: string;
  comment: string | null;
  actedBy: string;
  createdAt: string;
};

type CourseRow = {
  id: string;
  classroom_id: string;
  subject_id: string;
  term: string;
  subjects: Relation<{ name: string }>;
  classrooms: Relation<{ name: string; grade_level: string }>;
};

async function assignedCourses(profileId: string, includeAll: boolean) {
  const admin = createAdminClient();
  const select = "id,classroom_id,subject_id,term,subjects(name),classrooms(name,grade_level)";
  if (includeAll) {
    const { data } = await admin.from("courses").select(select).is("deleted_at", null).order("term");
    return (data ?? []) as unknown as CourseRow[];
  }

  const [leadCourses, secondaryCourses] = await Promise.all([
    admin.from("courses").select(select).eq("teacher_id", profileId).is("deleted_at", null).order("term"),
    admin.from("teacher_assignments").select(`courses(${select})`).eq("teacher_id", profileId).is("deleted_at", null),
  ]);
  const courseMap = new Map<string, CourseRow>();
  for (const course of (leadCourses.data ?? []) as unknown as CourseRow[]) courseMap.set(course.id, course);
  for (const assignment of (secondaryCourses.data ?? []) as unknown as Array<{ courses: Relation<CourseRow> }>) {
    const course = one(assignment.courses);
    if (course) courseMap.set(course.id, course);
  }
  return Array.from(courseMap.values());
}

export async function getLessonNotesWorkspace() {
  const { user, role } = await requireRoles(["teacher", "super_admin", "school_admin"]);
  const admin = createAdminClient();
  const canReview = ADMIN_ROLES.includes(role);
  const courseRows = await assignedCourses(user.id, canReview);
  const courses: LessonNoteCourse[] = courseRows.map((course) => ({
    id: course.id,
    classroomId: course.classroom_id,
    subjectId: course.subject_id,
    label: `${one(course.classrooms)?.grade_level ?? "Class"} - ${one(course.classrooms)?.name ?? "Class"} | ${one(course.subjects)?.name ?? "Subject"} | ${course.term}`,
  }));
  const classroomIds = Array.from(new Set(courses.map((course) => course.classroomId)));
  const subjectIds = Array.from(new Set(courses.map((course) => course.subjectId)));

  const notesRequest = canReview
    ? admin.from("lesson_plans").select("*").is("deleted_at", null).order("planned_for", { ascending: false }).limit(200)
    : admin.from("lesson_plans").select("*").eq("created_by", user.id).is("deleted_at", null).order("planned_for", { ascending: false }).limit(200);
  const schemesRequest = classroomIds.length && subjectIds.length
    ? admin.from("class_subject_schemes").select("id,classroom_id,subject_id,week_number,topic,term,status").in("classroom_id", classroomIds).in("subject_id", subjectIds).is("deleted_at", null).order("week_number")
    : Promise.resolve({ data: [] as unknown[] });
  const [notesResult, schemesResult] = await Promise.all([notesRequest, schemesRequest]);
  const noteRows = (notesResult.data ?? []) as unknown as Array<Record<string, unknown>>;
  const profileIds = Array.from(new Set(noteRows.flatMap((note) => [note.created_by, note.reviewed_by]).filter((value): value is string => typeof value === "string")));
  const planIds = noteRows.map((note) => String(note.id));
  const [profilesResult, reviewsResult] = await Promise.all([
    profileIds.length ? admin.from("profiles").select("id,first_name,last_name").in("id", profileIds) : Promise.resolve({ data: [] as unknown[] }),
    planIds.length ? admin.from("lesson_note_reviews").select("id,lesson_plan_id,decision,comment,acted_by,created_at").in("lesson_plan_id", planIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as unknown[] }),
  ]);
  const names = new Map<string, string>();
  for (const profile of (profilesResult.data ?? []) as unknown as Array<{ id: string; first_name: string; last_name: string }>) {
    names.set(profile.id, `${profile.first_name} ${profile.last_name}`.trim());
  }
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const schemes: LessonNoteScheme[] = [];
  for (const scheme of (schemesResult.data ?? []) as unknown as Array<{ id: string; classroom_id: string | null; subject_id: string | null; week_number: number; topic: string; term: string; status: string }>) {
    for (const course of courses) {
      if (course.classroomId === scheme.classroom_id && course.subjectId === scheme.subject_id) {
        schemes.push({ id: scheme.id, courseId: course.id, label: `Week ${scheme.week_number}: ${scheme.topic} (${scheme.term})` });
      }
    }
  }
  const schemeById = new Map(schemes.map((scheme) => [scheme.id, scheme]));
  const notes: LessonNoteRecord[] = noteRows.map((note) => {
    const status = String(note.review_status ?? "draft") as LessonNoteReviewStatus;
    const objectives = Array.isArray(note.objectives) ? note.objectives.filter((item): item is string => typeof item === "string") : [];
    return {
      id: String(note.id),
      title: String(note.title ?? "Untitled lesson"),
      courseId: String(note.course_id),
      courseLabel: courseById.get(String(note.course_id))?.label ?? "Course unavailable",
      schemeId: typeof note.scheme_id === "string" ? note.scheme_id : null,
      schemeLabel: typeof note.scheme_id === "string" ? schemeById.get(note.scheme_id)?.label ?? null : null,
      plannedFor: typeof note.planned_for === "string" ? note.planned_for : null,
      objectives,
      activities: String(note.activities ?? ""),
      lessonNote: String(note.lesson_note ?? ""),
      resources: String(note.resources ?? ""),
      homework: String(note.homework ?? ""),
      reviewStatus: status,
      reviewComment: typeof note.review_comment === "string" ? note.review_comment : null,
      submittedAt: typeof note.submitted_at === "string" ? note.submitted_at : null,
      reviewedAt: typeof note.reviewed_at === "string" ? note.reviewed_at : null,
      author: typeof note.created_by === "string" ? names.get(note.created_by) ?? "Teacher" : "Teacher",
      reviewer: typeof note.reviewed_by === "string" ? names.get(note.reviewed_by) ?? "Administrator" : null,
      revisionNumber: Number(note.revision_number ?? 1),
    };
  });
  const reviews: LessonNoteReview[] = ((reviewsResult.data ?? []) as unknown as Array<{ id: string; lesson_plan_id: string; decision: string; comment: string | null; acted_by: string; created_at: string }>).map((review) => ({
    id: review.id,
    lessonPlanId: review.lesson_plan_id,
    decision: review.decision,
    comment: review.comment,
    actedBy: names.get(review.acted_by) ?? "School reviewer",
    createdAt: review.created_at,
  }));
  return { canReview, courses, schemes, notes, reviews };
}

export type SchemeOfWorkRecord = {
  id: string;
  courseId: string;
  courseLabel: string;
  weekNumber: number;
  topic: string;
  objectives: string;
  resources: string;
  status: string;
  author: string;
};

export async function getSchemesOfWorkWorkspace() {
  const { user, role } = await requireRoles(["teacher", "super_admin", "school_admin"]);
  const admin = createAdminClient();
  const canReview = ADMIN_ROLES.includes(role);
  const courseRows = await assignedCourses(user.id, canReview);
  const courses: LessonNoteCourse[] = courseRows.map((course) => ({
    id: course.id,
    classroomId: course.classroom_id,
    subjectId: course.subject_id,
    label: `${one(course.classrooms)?.grade_level ?? "Class"} - ${one(course.classrooms)?.name ?? "Class"} | ${one(course.subjects)?.name ?? "Subject"} | ${course.term}`,
  }));
  const classroomIds = Array.from(new Set(courses.map((course) => course.classroomId)));
  const subjectIds = Array.from(new Set(courses.map((course) => course.subjectId)));
  const { data: schemeData } = classroomIds.length && subjectIds.length
    ? await admin.from("class_subject_schemes").select("id,classroom_id,subject_id,term,week_number,topic,objectives,resources,status,created_by").in("classroom_id", classroomIds).in("subject_id", subjectIds).is("deleted_at", null).order("week_number")
    : { data: [] };
  const rows = (schemeData ?? []) as unknown as Array<{ id: string; classroom_id: string | null; subject_id: string | null; term: string; week_number: number; topic: string; objectives: string | null; resources: string | null; status: string; created_by: string | null }>;
  const authors = Array.from(new Set(rows.map((row) => row.created_by).filter((value): value is string => Boolean(value))));
  const { data: profileData } = authors.length ? await admin.from("profiles").select("id,first_name,last_name").in("id", authors) : { data: [] };
  const names = new Map<string, string>();
  for (const profile of (profileData ?? []) as unknown as Array<{ id: string; first_name: string; last_name: string }>) names.set(profile.id, `${profile.first_name} ${profile.last_name}`.trim());
  const records: SchemeOfWorkRecord[] = [];
  for (const row of rows) {
    for (const course of courses) {
      if (course.classroomId === row.classroom_id && course.subjectId === row.subject_id) {
        records.push({
          id: row.id,
          courseId: course.id,
          courseLabel: course.label,
          weekNumber: row.week_number,
          topic: row.topic,
          objectives: row.objectives ?? "",
          resources: row.resources ?? "",
          status: row.status,
          author: row.created_by ? names.get(row.created_by) ?? "Teacher" : "Teacher",
        });
      }
    }
  }
  return { canReview, courses, records };
}
