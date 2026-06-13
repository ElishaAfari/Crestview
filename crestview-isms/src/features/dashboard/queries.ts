import "server-only";

import { requireRoles, requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;
type ProfileJoin = { first_name: string; last_name: string };
type SelectOption = { id: string; label: string };
export type GradeImportStudent = { id: string; studentNumber: string; name: string };
export type GradeImportContext = {
  gradeItemId: string;
  label: string;
  courseId: string;
  classroomId: string;
  classroomName: string;
  subjectName: string;
  term: string;
  assessmentTitle: string;
  maxScore: number;
  students: GradeImportStudent[];
};
export type TeacherAttendanceStudent = { id: string; studentNumber: string; name: string };
export type TeacherAttendanceCourse = { id: string; label: string; classroomId: string; classroomLabel: string; students: TeacherAttendanceStudent[] };
export type TeacherClassRoster = {
  classroomId: string;
  classroomName: string;
  gradeLevel: string;
  academicYearId: string | null;
  academicYear: string;
  subjects: string[];
  students: Array<{ id: string; studentNumber: string; firstName: string; lastName: string; name: string }>;
};
export type AttendanceRegisterRow = {
  id: string;
  classroom: string;
  date: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
};

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listStudents() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("students").select("id,student_number,status,classrooms(name),profiles!students_profile_id_fkey(first_name,last_name)").order("student_number");
  const records = (data ?? []) as unknown as Array<{
    id: string;
    student_number: string;
    status: string;
    classrooms: Relation<{ name: string }>;
    profiles: Relation<ProfileJoin>;
  }>;

  return records.map((student) => {
    const profile = one(student.profiles);
    return {
      id: student.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number,
      studentNumber: student.student_number,
      classroom: one(student.classrooms)?.name ?? "Unassigned",
      status: student.status
    };
  });
}

export async function listStaff() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("profiles").select("id,first_name,last_name,phone,is_active,roles(name)").order("last_name");
  const records = (data ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    is_active: boolean | null;
    roles: Relation<{ name: string }>;
  }>;
  const staffRoles = new Set(["teacher", "hr_staff", "finance_officer", "librarian", "it_support", "school_admin", "super_admin"]);

  return records.flatMap((profile) => {
    const role = one(profile.roles)?.name;
    return role && staffRoles.has(role)
      ? [{ id: profile.id, name: `${profile.first_name} ${profile.last_name}`, role: role.replaceAll("_", " "), phone: profile.phone ?? "Not provided", status: profile.is_active === false ? "disabled" : "active" }]
      : [];
  });
}

export async function listAttendanceRecords() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("attendance_records")
    .select("id,attendance_date,status,students(profiles!students_profile_id_fkey(first_name,last_name))")
    .is("deleted_at", null)
    .order("attendance_date", { ascending: false })
    .limit(50);
  const records = (data ?? []) as unknown as Array<{
    id: string;
    attendance_date: string;
    status: string;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>;

  return records.map((record) => {
    const profile = one(one(record.students)?.profiles);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      date: record.attendance_date,
      status: record.status
    };
  });
}

export async function listAttendanceRegisters(): Promise<AttendanceRegisterRow[]> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  let classroomIds: string[] | null = null;

  if (role === "teacher") {
    const [leadCourses, assignedCourses] = await Promise.all([
      admin.from("courses").select("classroom_id").eq("teacher_id", user.id).is("deleted_at", null),
      admin.from("teacher_assignments").select("courses(classroom_id)").eq("teacher_id", user.id).is("deleted_at", null)
    ]);
    classroomIds = Array.from(new Set([
      ...((leadCourses.data ?? []) as Array<{ classroom_id: string | null }>).map((course) => course.classroom_id),
      ...((assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<{ classroom_id: string | null }> }>).map((row) => one(row.courses)?.classroom_id)
    ].filter((id): id is string => Boolean(id))));
    if (!classroomIds.length) return [];
  }

  let query = admin
    .from("attendance_registers")
    .select("id,attendance_date,status,submitted_at,counts,classrooms(name,grade_level),profiles!attendance_registers_submitted_by_fkey(first_name,last_name)")
    .is("deleted_at", null)
    .order("attendance_date", { ascending: false })
    .limit(80);
  if (classroomIds) query = query.in("classroom_id", classroomIds);

  const { data } = await query;
  return ((data ?? []) as unknown as Array<{
    id: string;
    attendance_date: string;
    status: string;
    submitted_at: string | null;
    counts: Record<string, unknown> | null;
    classrooms: Relation<{ name: string; grade_level: string }>;
    profiles: Relation<ProfileJoin>;
  }>).map((register) => {
    const classroom = one(register.classrooms);
    const submitter = one(register.profiles);
    const counts = register.counts ?? {};
    return {
      id: register.id,
      classroom: classroom ? `${classroom.grade_level} - ${classroom.name}` : "Class",
      date: register.attendance_date,
      status: register.status,
      submittedBy: submitter ? `${submitter.first_name} ${submitter.last_name}` : "Not recorded",
      submittedAt: register.submitted_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(register.submitted_at)) : "Not submitted",
      present: Number(counts.present ?? 0),
      late: Number(counts.late ?? 0),
      absent: Number(counts.absent ?? 0),
      excused: Number(counts.excused ?? 0),
      total: Number(counts.total ?? 0)
    };
  });
}

export async function listGrades() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("grades").select("id,score,percentage,grade_code,remark,comments,assignment_score,quiz_score,midterm_score,class_assessment_score,exam_score,total_score,subject_name,term_label,grade_items(title,max_score,courses(subjects(name),classrooms(name))),students(student_number,profiles!students_profile_id_fkey(first_name,last_name))").order("created_at", { ascending: false }).limit(50);
  const records = (data ?? []) as unknown as Array<{
    id: string;
    score: number;
    percentage: number | null;
    grade_code: string | null;
    remark: string | null;
    comments: string | null;
    assignment_score: number | null;
    quiz_score: number | null;
    midterm_score: number | null;
    class_assessment_score: number | null;
    exam_score: number | null;
    total_score: number | null;
    subject_name: string | null;
    term_label: string | null;
    grade_items: Relation<{ title: string; max_score: number | null; courses: Relation<{ subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }> }>;
    students: Relation<{ student_number: string; profiles: Relation<ProfileJoin> }>;
  }>;

  return records.map((record) => {
    const student = one(record.students);
    const profile = one(student?.profiles);
    const gradeItem = one(record.grade_items);
    const course = one(gradeItem?.courses);
    const total = Number(record.total_score ?? record.percentage ?? record.score);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : student?.student_number ?? "Student",
      assessment: `${record.subject_name ?? one(course?.subjects)?.name ?? "Course"}${course ? ` - ${one(course.classrooms)?.name ?? ""}` : ""}${record.term_label ? ` (${record.term_label})` : ""}`.trim(),
      classAssessment: record.class_assessment_score !== null ? `${Number(record.class_assessment_score).toFixed(1)}/30` : "",
      examScore: record.exam_score !== null ? `${Number(record.exam_score).toFixed(1)}/70` : "",
      score: `${total.toFixed(1)}/100`,
      percentage: record.percentage !== null ? `${Number(record.percentage).toFixed(1)}%` : `${total.toFixed(1)}%`,
      gradeCode: record.grade_code ?? "",
      remark: record.remark ?? "",
      comments: record.comments ?? ""
    };
  });
}

export async function listParentStudents() {
  const { user } = await requireRoles(["parent"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("parent_students")
    .select("students(id,student_number,status,classrooms(name),profiles!students_profile_id_fkey(first_name,last_name))")
    .eq("parent_profile_id", user.id)
    .is("deleted_at", null);

  return ((data ?? []) as unknown as Array<{
    students: Relation<{
      id: string;
      student_number: string;
      status: string;
      classrooms: Relation<{ name: string }>;
      profiles: Relation<ProfileJoin>;
    }>;
  }>).flatMap((link) => {
    const student = one(link.students);
    if (!student) return [];
    const profile = one(student.profiles);
    return [{
      id: student.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number,
      studentNumber: student.student_number,
      classroom: one(student.classrooms)?.name ?? "Unassigned",
      status: student.status
    }];
  });
}

export async function listParentGrades() {
  const { user } = await requireRoles(["parent"]);
  const admin = createAdminClient();
  const { data: links } = await admin.from("parent_students").select("student_id").eq("parent_profile_id", user.id).is("deleted_at", null);
  const studentIds = ((links ?? []) as Array<{ student_id: string }>).map((link) => link.student_id);
  if (!studentIds.length) return [];
  const { data } = await admin
    .from("grades")
    .select("id,score,percentage,grade_code,remark,comments,assignment_score,quiz_score,midterm_score,class_assessment_score,exam_score,total_score,subject_name,term_label,grade_items(title,max_score,courses(subjects(name))),students(student_number,profiles!students_profile_id_fkey(first_name,last_name))")
    .in("student_id", studentIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  return ((data ?? []) as unknown as Array<{
    id: string;
    score: number;
    percentage: number | null;
    grade_code: string | null;
    remark: string | null;
    comments: string | null;
    assignment_score: number | null;
    quiz_score: number | null;
    midterm_score: number | null;
    class_assessment_score: number | null;
    exam_score: number | null;
    total_score: number | null;
    subject_name: string | null;
    term_label: string | null;
    grade_items: Relation<{ title: string; max_score: number | null; courses: Relation<{ subjects: Relation<{ name: string }> }> }>;
    students: Relation<{ student_number: string; profiles: Relation<ProfileJoin> }>;
  }>).map((record) => {
    const student = one(record.students);
    const profile = one(student?.profiles);
    const gradeItem = one(record.grade_items);
    const course = one(gradeItem?.courses);
    const total = Number(record.total_score ?? record.percentage ?? record.score);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : student?.student_number ?? "Student",
      assessment: `${record.subject_name ?? one(course?.subjects)?.name ?? "Course"}${record.term_label ? ` (${record.term_label})` : ""}`.trim(),
      classAssessment: record.class_assessment_score !== null ? `${Number(record.class_assessment_score).toFixed(1)}/30` : "",
      examScore: record.exam_score !== null ? `${Number(record.exam_score).toFixed(1)}/70` : "",
      score: `${total.toFixed(1)}/100`,
      percentage: record.percentage !== null ? `${Number(record.percentage).toFixed(1)}%` : `${total.toFixed(1)}%`,
      gradeCode: record.grade_code ?? "",
      remark: record.remark ?? "",
      comments: record.comments ?? ""
    };
  });
}

export async function listParentReports() {
  const { user } = await requireRoles(["parent"]);
  const admin = createAdminClient();
  const { data: links } = await admin.from("parent_students").select("student_id").eq("parent_profile_id", user.id).is("deleted_at", null);
  const studentIds = ((links ?? []) as Array<{ student_id: string }>).map((link) => link.student_id);
  if (!studentIds.length) return [];
  const { data } = await admin
    .from("reports")
    .select("id,term,summary,status,report_url,created_at,students(student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
    .in("student_id", studentIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as unknown as Array<{
    id: string;
    term: string;
    summary: string | null;
    status: string | null;
    report_url: string | null;
    created_at: string | null;
    students: Relation<{ student_number: string; profiles: Relation<ProfileJoin> }>;
    academic_years: Relation<{ name: string }>;
  }>).map((report) => {
    const student = one(report.students);
    const profile = one(student?.profiles);
    return {
      id: report.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : student?.student_number ?? "Student",
      academicYear: one(report.academic_years)?.name ?? "Academic year",
      term: report.term,
      summary: report.summary ?? "Ready for review",
      status: report.status ?? "draft",
      downloadUrl: report.report_url ?? `/api/reports/${report.id}/pdf`,
      createdAt: report.created_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(report.created_at)) : "Just now"
    };
  });
}

export async function listCurrentStudentAttendanceRecords() {
  const { user } = await requireRoles(["student"]);
  const admin = createAdminClient();
  const { data: studentRecord } = await admin.from("students").select("id").eq("profile_id", user.id).is("deleted_at", null).maybeSingle();
  const student = studentRecord as { id: string } | null;
  if (!student) return [];

  const { data } = await admin
    .from("attendance_records")
    .select("id,attendance_date,status,students(profiles!students_profile_id_fkey(first_name,last_name))")
    .eq("student_id", student.id)
    .is("deleted_at", null)
    .order("attendance_date", { ascending: false })
    .limit(50);

  return ((data ?? []) as unknown as Array<{
    id: string;
    attendance_date: string;
    status: string;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>).map((record) => {
    const profile = one(one(record.students)?.profiles);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      date: record.attendance_date,
      status: record.status
    };
  });
}

export async function listCurrentStudentGrades() {
  const { user } = await requireRoles(["student"]);
  const admin = createAdminClient();
  const { data: studentRecord } = await admin.from("students").select("id").eq("profile_id", user.id).is("deleted_at", null).maybeSingle();
  const student = studentRecord as { id: string } | null;
  if (!student) return [];

  const { data } = await admin
    .from("grades")
    .select("id,score,percentage,grade_code,remark,comments,assignment_score,quiz_score,midterm_score,class_assessment_score,exam_score,total_score,subject_name,term_label,grade_items(title,max_score,courses(subjects(name))),students(profiles!students_profile_id_fkey(first_name,last_name))")
    .eq("student_id", student.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as unknown as Array<{
    id: string;
    score: number;
    percentage: number | null;
    grade_code: string | null;
    remark: string | null;
    comments: string | null;
    assignment_score: number | null;
    quiz_score: number | null;
    midterm_score: number | null;
    class_assessment_score: number | null;
    exam_score: number | null;
    total_score: number | null;
    subject_name: string | null;
    term_label: string | null;
    grade_items: Relation<{ title: string; max_score: number | null; courses: Relation<{ subjects: Relation<{ name: string }> }> }>;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>).map((record) => {
    const profile = one(one(record.students)?.profiles);
    const gradeItem = one(record.grade_items);
    const course = one(gradeItem?.courses);
    const total = Number(record.total_score ?? record.percentage ?? record.score);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      assessment: `${record.subject_name ?? one(course?.subjects)?.name ?? "Course"}${record.term_label ? ` (${record.term_label})` : ""}`.trim(),
      classAssessment: record.class_assessment_score !== null ? `${Number(record.class_assessment_score).toFixed(1)}/30` : "",
      examScore: record.exam_score !== null ? `${Number(record.exam_score).toFixed(1)}/70` : "",
      score: `${total.toFixed(1)}/100`,
      percentage: record.percentage !== null ? `${Number(record.percentage).toFixed(1)}%` : `${total.toFixed(1)}%`,
      gradeCode: record.grade_code ?? "",
      remark: record.remark ?? "",
      comments: record.comments ?? ""
    };
  });
}

export async function listCurrentStudentReports() {
  const { user } = await requireRoles(["student"]);
  const admin = createAdminClient();
  const { data: studentRecord } = await admin.from("students").select("id").eq("profile_id", user.id).is("deleted_at", null).maybeSingle();
  const student = studentRecord as { id: string } | null;
  if (!student) return [];

  const { data } = await admin
    .from("reports")
    .select("id,term,summary,status,report_url,created_at,students(student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
    .eq("student_id", student.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as unknown as Array<{
    id: string;
    term: string;
    summary: string | null;
    status: string | null;
    report_url: string | null;
    created_at: string | null;
    students: Relation<{ student_number: string; profiles: Relation<ProfileJoin> }>;
    academic_years: Relation<{ name: string }>;
  }>).map((report) => {
    const studentRow = one(report.students);
    const profile = one(studentRow?.profiles);
    return {
      id: report.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : studentRow?.student_number ?? "Student",
      academicYear: one(report.academic_years)?.name ?? "Academic year",
      term: report.term,
      summary: report.summary ?? "Ready for review",
      status: report.status ?? "draft",
      downloadUrl: report.report_url ?? `/api/reports/${report.id}/pdf`,
      createdAt: report.created_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(report.created_at)) : "Just now"
    };
  });
}

export async function getStudentDashboardData() {
  const { user } = await requireRoles(["student"]);
  const admin = createAdminClient();
  const { data: studentRecord } = await admin.from("students").select("id,classroom_id").eq("profile_id", user.id).is("deleted_at", null).maybeSingle();
  const student = studentRecord as { id: string; classroom_id: string | null } | null;
  if (!student) return { average: 0, attendanceRate: 0, assignmentCount: 0, openInvoices: 0, reportCount: 0 };

  const courseQuery = student.classroom_id
    ? admin.from("courses").select("id").eq("classroom_id", student.classroom_id).is("deleted_at", null)
    : Promise.resolve({ data: [] });
  const [grades, attendance, courses, invoices, reports] = await Promise.all([
    admin.from("grades").select("score,percentage,total_score,grade_items(max_score)").eq("student_id", student.id).is("deleted_at", null),
    admin.from("attendance_records").select("status").eq("student_id", student.id).is("deleted_at", null),
    courseQuery,
    admin.from("invoices").select("*", { count: "exact", head: true }).eq("student_id", student.id).in("status", ["draft", "open", "overdue"]).is("deleted_at", null),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("student_id", student.id).is("deleted_at", null)
  ]);

  const gradeRows = (grades.data ?? []) as unknown as Array<{ score: number; percentage: number | null; total_score: number | null; grade_items: Relation<{ max_score: number }> }>;
  const average = gradeRows.length
    ? Math.round(gradeRows.reduce((sum, row) => sum + Number(row.total_score ?? row.percentage ?? ((Number(row.score) / Number(one(row.grade_items)?.max_score ?? 100)) * 100)), 0) / gradeRows.length)
    : 0;
  const attendanceRows = (attendance.data ?? []) as Array<{ status: string }>;
  const present = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;
  const attendanceRate = attendanceRows.length ? Math.round((present / attendanceRows.length) * 100) : 0;
  const courseIds = ((courses.data ?? []) as Array<{ id: string }>).map((course) => course.id);
  const { count: assignmentCount } = courseIds.length
    ? await admin.from("assignments").select("*", { count: "exact", head: true }).in("course_id", courseIds).is("deleted_at", null)
    : { count: 0 };

  return {
    average,
    attendanceRate,
    assignmentCount: assignmentCount ?? 0,
    openInvoices: invoices.count ?? 0,
    reportCount: reports.count ?? 0
  };
}

export async function getParentDashboardData() {
  const { user } = await requireRoles(["parent"]);
  const admin = createAdminClient();
  const { data: links } = await admin.from("parent_students").select("student_id").eq("parent_profile_id", user.id).is("deleted_at", null);
  const studentIds = ((links ?? []) as Array<{ student_id: string }>).map((link) => link.student_id);
  if (!studentIds.length) return { children: 0, attendanceRate: 0, openInvoices: 0, unreadNotifications: 0 };

  const [attendance, invoices, notifications] = await Promise.all([
    admin.from("attendance_records").select("status").in("student_id", studentIds).is("deleted_at", null),
    admin.from("invoices").select("*", { count: "exact", head: true }).in("student_id", studentIds).in("status", ["draft", "open", "overdue"]).is("deleted_at", null),
    admin.from("notifications").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null).is("deleted_at", null)
  ]);
  const attendanceRows = (attendance.data ?? []) as Array<{ status: string }>;
  const present = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;

  return {
    children: studentIds.length,
    attendanceRate: attendanceRows.length ? Math.round((present / attendanceRows.length) * 100) : 0,
    openInvoices: invoices.count ?? 0,
    unreadNotifications: notifications.count ?? 0
  };
}

export async function getTeacherDashboardData() {
  const { user } = await requireRoles(["teacher"]);
  const admin = createAdminClient();
  const [leadCourses, assignedCourses] = await Promise.all([
    admin.from("courses").select("id,classroom_id").eq("teacher_id", user.id).is("deleted_at", null),
    admin.from("teacher_assignments").select("courses(id,classroom_id)").eq("teacher_id", user.id).is("deleted_at", null)
  ]);
  const courseMap = new Map<string, { id: string; classroom_id: string }>();
  for (const course of (leadCourses.data ?? []) as Array<{ id: string; classroom_id: string }>) courseMap.set(course.id, course);
  for (const row of (assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<{ id: string; classroom_id: string }> }>) {
    const course = one(row.courses);
    if (course) courseMap.set(course.id, course);
  }
  const courseRows = Array.from(courseMap.values());
  const courseIds = courseRows.map((course) => course.id);
  const classroomIds = Array.from(new Set(courseRows.map((course) => course.classroom_id).filter(Boolean)));
  const [assignments, grades, attendance] = await Promise.all([
    courseIds.length ? admin.from("assignments").select("*", { count: "exact", head: true }).in("course_id", courseIds).is("deleted_at", null) : Promise.resolve({ count: 0 }),
    courseIds.length ? admin.from("grades").select("grade_items!inner(course_id)", { count: "exact", head: true }).in("grade_items.course_id", courseIds).is("deleted_at", null) : Promise.resolve({ count: 0 }),
    classroomIds.length ? admin.from("attendance_records").select("status").in("classroom_id", classroomIds).eq("attendance_date", new Date().toISOString().slice(0, 10)).is("deleted_at", null) : Promise.resolve({ data: [] })
  ]);
  const attendanceRows = (attendance.data ?? []) as Array<{ status: string }>;
  const present = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;

  return {
    classes: classroomIds.length,
    courses: courseRows.length,
    assignments: assignments.count ?? 0,
    gradedItems: grades.count ?? 0,
    attendanceRate: attendanceRows.length ? Math.round((present / attendanceRows.length) * 100) : 0
  };
}

export async function listFamilyInvoices() {
  const { user } = await requireRoles(["parent"]);
  const admin = createAdminClient();
  const { data: links } = await admin.from("parent_students").select("student_id").eq("parent_profile_id", user.id).is("deleted_at", null);
  const studentIds = ((links ?? []) as Array<{ student_id: string }>).map((link) => link.student_id);
  if (!studentIds.length) return [];
  const { data } = await admin.from("invoices").select("id,invoice_number,title,amount,currency,status,due_date,students(student_number,profiles!students_profile_id_fkey(first_name,last_name))").in("student_id", studentIds).is("deleted_at", null).order("due_date", { ascending: true });
  return ((data ?? []) as unknown as Array<{
    id: string;
    invoice_number: string;
    title: string | null;
    amount: number;
    currency: string;
    status: string;
    due_date: string;
    students: Relation<{ student_number: string; profiles: Relation<ProfileJoin> }>;
  }>).map((invoice) => {
    const student = one(invoice.students);
    const profile = one(student?.profiles);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      title: invoice.title ?? "School fees",
      student: profile ? `${profile.first_name} ${profile.last_name}` : student?.student_number ?? "Student",
      amount: `${invoice.currency} ${Number(invoice.amount).toLocaleString("en-GH")}`,
      status: invoice.status,
      dueDate: invoice.due_date
    };
  });
}

export async function listAssignmentsForCurrentRole() {
  const { user } = await requireRoles(["student", "parent", "teacher"]);
  const admin = createAdminClient();
  const { data: roleRecord } = await admin.from("profiles").select("roles(name)").eq("id", user.id).maybeSingle();
  const roleName = one((roleRecord as unknown as { roles: Relation<{ name: string }> } | null)?.roles)?.name;
  let courseIds: string[] = [];

  if (roleName === "teacher") {
    const { data } = await admin.from("courses").select("id").eq("teacher_id", user.id).is("deleted_at", null);
    courseIds = ((data ?? []) as Array<{ id: string }>).map((course) => course.id);
  } else {
    let classroomIds: string[] = [];
    if (roleName === "student") {
      const { data: studentRecord } = await admin.from("students").select("classroom_id").eq("profile_id", user.id).is("deleted_at", null).maybeSingle();
      const student = studentRecord as { classroom_id: string | null } | null;
      classroomIds = student?.classroom_id ? [student.classroom_id] : [];
    } else {
      const { data: links } = await admin.from("parent_students").select("students(classroom_id)").eq("parent_profile_id", user.id).is("deleted_at", null);
      classroomIds = ((links ?? []) as unknown as Array<{ students: Relation<{ classroom_id: string | null }> }>)
        .map((link) => one(link.students)?.classroom_id)
        .filter((id): id is string => Boolean(id));
    }
    if (classroomIds.length) {
      const { data } = await admin.from("courses").select("id").in("classroom_id", classroomIds).is("deleted_at", null);
      courseIds = ((data ?? []) as Array<{ id: string }>).map((course) => course.id);
    }
  }

  if (!courseIds.length) return [];
  const { data } = await admin.from("assignments").select("id,title,due_at,max_score,courses(subjects(name),classrooms(name))").in("course_id", courseIds).is("deleted_at", null).order("due_at", { ascending: true });
  return ((data ?? []) as unknown as Array<{
    id: string;
    title: string;
    due_at: string | null;
    max_score: number;
    courses: Relation<{ subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }>;
  }>).map((assignment) => {
    const course = one(assignment.courses);
    return {
      id: assignment.id,
      title: assignment.title,
      course: `${one(course?.subjects)?.name ?? "Course"} - ${one(course?.classrooms)?.name ?? "Class"}`,
      dueAt: assignment.due_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(assignment.due_at)) : "No due date",
      maxScore: String(assignment.max_score)
    };
  });
}

export async function listTeacherFormOptions(): Promise<{ courses: SelectOption[]; gradeItems: SelectOption[]; students: SelectOption[]; classrooms: SelectOption[]; gradeImportContexts: GradeImportContext[] }> {
  const { user } = await requireRoles(["teacher"]);
  const admin = createAdminClient();
  const [leadCourses, assignedCourses] = await Promise.all([
    admin.from("courses").select("id,term,classroom_id,subjects(name),classrooms(name,grade_level)").eq("teacher_id", user.id).is("deleted_at", null).order("term"),
    admin.from("teacher_assignments").select("courses(id,term,classroom_id,subjects(name),classrooms(name,grade_level))").eq("teacher_id", user.id).is("deleted_at", null)
  ]);
  type CourseOptionRow = {
    id: string;
    term: string;
    classroom_id: string;
    subjects: Relation<{ name: string }>;
    classrooms: Relation<{ name: string; grade_level: string }>;
  };
  const courseMap = new Map<string, CourseOptionRow>();
  for (const course of (leadCourses.data ?? []) as unknown as CourseOptionRow[]) courseMap.set(course.id, course);
  for (const row of (assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<CourseOptionRow> }>) {
    const course = one(row.courses);
    if (course) courseMap.set(course.id, course);
  }
  const courseRows = Array.from(courseMap.values());
  const courseIds = courseRows.map((course) => course.id);
  const classroomIds = Array.from(new Set(courseRows.map((course) => course.classroom_id).filter(Boolean)));
  const [gradeItems, students] = await Promise.all([
    courseIds.length ? admin.from("grade_items").select("id,title,category,max_score,course_id,courses(id,classroom_id,term,subjects(name),classrooms(id,name,grade_level))").in("course_id", courseIds).is("deleted_at", null).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    classroomIds.length ? admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").in("classroom_id", classroomIds).is("deleted_at", null).order("student_number") : Promise.resolve({ data: [] })
  ]);
  const { data: importStudents } = classroomIds.length
    ? await admin
        .from("students")
        .select("id,student_number,classroom_id,profiles!students_profile_id_fkey(first_name,last_name)")
        .in("classroom_id", classroomIds)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("student_number")
    : { data: [] };
  const studentsByClassroom = new Map<string, GradeImportStudent[]>();
  for (const student of (importStudents ?? []) as unknown as Array<{ id: string; student_number: string; classroom_id: string; profiles: Relation<ProfileJoin> }>) {
    const profile = one(student.profiles);
    const rows = studentsByClassroom.get(student.classroom_id) ?? [];
    rows.push({
      id: student.id,
      studentNumber: student.student_number,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number
    });
    studentsByClassroom.set(student.classroom_id, rows);
  }
  const gradeItemRows = (gradeItems.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    category: string;
    max_score: number | null;
    course_id: string;
    courses: Relation<{ id: string; classroom_id: string; term: string; subjects: Relation<{ name: string }>; classrooms: Relation<{ id: string; name: string; grade_level: string }> }>;
  }>;
  const importRows = gradeItemRows.filter((item) => item.category === "term_report" || Number(item.max_score ?? 100) === 100);

  return {
    courses: courseRows.map((course) => ({
      id: course.id,
      label: `${one(course.subjects)?.name ?? "Course"} - ${one(course.classrooms)?.name ?? "Class"} (${course.term})`
    })),
    classrooms: courseRows.map((course) => ({
      id: course.classroom_id,
      label: `${one(course.classrooms)?.grade_level ?? "Class"} - ${one(course.classrooms)?.name ?? "Class"}`
    })),
    gradeItems: gradeItemRows.map((item) => {
      const course = one(item.courses);
      return { id: item.id, label: `${item.title} - ${one(course?.subjects)?.name ?? "Course"} ${one(course?.classrooms)?.name ?? ""}`.trim() };
    }),
    students: ((students.data ?? []) as unknown as Array<{ id: string; student_number: string; profiles: Relation<ProfileJoin> }>).map((student) => {
      const profile = one(student.profiles);
      return { id: student.id, label: `${profile ? `${profile.first_name} ${profile.last_name}` : "Student"} (${student.student_number})` };
    }),
    gradeImportContexts: importRows.map((item) => {
      const course = one(item.courses);
      const classroom = one(course?.classrooms);
      const subject = one(course?.subjects);
      const classroomId = course?.classroom_id ?? classroom?.id ?? "";
      return {
        gradeItemId: item.id,
        label: `${classroom?.name ?? "Class"} - ${subject?.name ?? "Subject"} - ${course?.term ?? "Term"} - ${item.title}`,
        courseId: course?.id ?? item.course_id,
        classroomId,
        classroomName: classroom?.name ?? "Class",
        subjectName: subject?.name ?? "Subject",
        term: course?.term ?? "Term",
        assessmentTitle: item.title,
        maxScore: Number(item.max_score ?? 100),
        students: classroomId ? studentsByClassroom.get(classroomId) ?? [] : []
      };
    })
  };
}

export async function listTeacherAttendanceRoster(): Promise<TeacherAttendanceCourse[]> {
  const { user } = await requireRoles(["teacher"]);
  const admin = createAdminClient();
  const [leadCourses, assignedCourses] = await Promise.all([
    admin
      .from("courses")
      .select("id,term,classroom_id,subjects(name),classrooms(name,grade_level)")
      .eq("teacher_id", user.id)
      .is("deleted_at", null)
      .order("term"),
    admin
      .from("teacher_assignments")
      .select("courses(id,term,classroom_id,subjects(name),classrooms(name,grade_level))")
      .eq("teacher_id", user.id)
      .is("deleted_at", null)
  ]);

  type CourseRow = {
    id: string;
    term: string;
    classroom_id: string;
    subjects: Relation<{ name: string }>;
    classrooms: Relation<{ name: string; grade_level: string }>;
  };
  const courseMap = new Map<string, CourseRow>();
  for (const course of (leadCourses.data ?? []) as unknown as CourseRow[]) courseMap.set(course.id, course);
  for (const row of (assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<CourseRow> }>) {
    const course = one(row.courses);
    if (course) courseMap.set(course.id, course);
  }

  const courses = Array.from(courseMap.values()).sort((a, b) => {
    const classroomA = one(a.classrooms);
    const classroomB = one(b.classrooms);
    const classCompare = `${classroomA?.grade_level ?? ""} ${classroomA?.name ?? ""}`.localeCompare(`${classroomB?.grade_level ?? ""} ${classroomB?.name ?? ""}`, undefined, { numeric: true });
    if (classCompare) return classCompare;
    const subjectCompare = (one(a.subjects)?.name ?? "").localeCompare(one(b.subjects)?.name ?? "");
    if (subjectCompare) return subjectCompare;
    return a.term.localeCompare(b.term, undefined, { numeric: true });
  });
  const classroomIds = Array.from(new Set(courses.map((course) => course.classroom_id).filter(Boolean)));
  const { data: students } = classroomIds.length
    ? await admin
        .from("students")
        .select("id,student_number,classroom_id,profiles!students_profile_id_fkey(first_name,last_name)")
        .in("classroom_id", classroomIds)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("student_number")
    : { data: [] };

  const studentsByClassroom = new Map<string, TeacherAttendanceStudent[]>();
  for (const student of (students ?? []) as unknown as Array<{ id: string; student_number: string; classroom_id: string; profiles: Relation<ProfileJoin> }>) {
    const profile = one(student.profiles);
    const roster = studentsByClassroom.get(student.classroom_id) ?? [];
    roster.push({
      id: student.id,
      studentNumber: student.student_number,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number
    });
    studentsByClassroom.set(student.classroom_id, roster);
  }

  const classMap = new Map<string, { classroomLabel: string; subjects: Set<string>; students: TeacherAttendanceStudent[] }>();
  for (const course of courses) {
    const classroom = one(course.classrooms);
    const existing = classMap.get(course.classroom_id);
    const entry = existing ?? {
      classroomLabel: `${classroom?.grade_level ?? "Class"} - ${classroom?.name ?? "Class"}`,
      subjects: new Set<string>(),
      students: studentsByClassroom.get(course.classroom_id) ?? []
    };
    const subject = one(course.subjects)?.name;
    if (subject) entry.subjects.add(subject);
    classMap.set(course.classroom_id, entry);
  }

  return Array.from(classMap.entries()).map(([classroomId, item]) => ({
    id: classroomId,
    label: item.classroomLabel,
    classroomId,
    classroomLabel: `${item.classroomLabel}${item.subjects.size ? ` - ${item.subjects.size} subject${item.subjects.size === 1 ? "" : "s"}` : ""}`,
    students: item.students
  }));
}

export async function listTeacherClassRosters(): Promise<TeacherClassRoster[]> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  type CourseRow = {
    id: string;
    classroom_id: string;
    academic_year_id: string | null;
    teacher_id: string | null;
    subjects: Relation<{ name: string }>;
    classrooms: Relation<{ id: string; name: string; grade_level: string; academic_year_id: string | null; academic_years: Relation<{ name: string }> }>;
  };

  const [leadCourses, assignedCourses] = role === "teacher"
    ? await Promise.all([
        admin
          .from("courses")
          .select("id,classroom_id,academic_year_id,teacher_id,subjects(name),classrooms(id,name,grade_level,academic_year_id,academic_years(name))")
          .eq("teacher_id", user.id)
          .is("deleted_at", null),
        admin
          .from("teacher_assignments")
          .select("courses(id,classroom_id,academic_year_id,teacher_id,subjects(name),classrooms(id,name,grade_level,academic_year_id,academic_years(name)))")
          .eq("teacher_id", user.id)
          .is("deleted_at", null)
      ])
    : await Promise.all([
        admin
          .from("courses")
          .select("id,classroom_id,academic_year_id,teacher_id,subjects(name),classrooms(id,name,grade_level,academic_year_id,academic_years(name))")
          .is("deleted_at", null)
          .limit(500),
        Promise.resolve({ data: [] })
      ]);

  const courseMap = new Map<string, CourseRow>();
  for (const course of (leadCourses.data ?? []) as unknown as CourseRow[]) courseMap.set(course.id, course);
  for (const row of (assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<CourseRow> }>) {
    const course = one(row.courses);
    if (course) courseMap.set(course.id, course);
  }

  const assignedCoursesList = Array.from(courseMap.values());
  const classKeys = new Map<string, { classroomId: string; academicYearId: string | null; classroomName: string; gradeLevel: string; academicYear: string }>();
  for (const course of assignedCoursesList) {
    const classroom = one(course.classrooms);
    if (!classroom) continue;
    const key = `${classroom.id}:${course.academic_year_id ?? classroom.academic_year_id ?? ""}`;
    classKeys.set(key, {
      classroomId: classroom.id,
      academicYearId: course.academic_year_id ?? classroom.academic_year_id ?? null,
      classroomName: classroom.name,
      gradeLevel: classroom.grade_level,
      academicYear: one(classroom.academic_years)?.name ?? "Academic year"
    });
  }

  const classrooms = Array.from(classKeys.values());
  if (!classrooms.length) return [];
  const classroomIds = Array.from(new Set(classrooms.map((item) => item.classroomId)));
  const academicYearIds = Array.from(new Set(classrooms.map((item) => item.academicYearId).filter((id): id is string => Boolean(id))));

  let subjectQuery = admin
    .from("courses")
    .select("classroom_id,academic_year_id,subjects(name)")
    .in("classroom_id", classroomIds)
    .is("deleted_at", null);
  if (academicYearIds.length) subjectQuery = subjectQuery.in("academic_year_id", academicYearIds);

  const [subjectRows, studentRows] = await Promise.all([
    subjectQuery,
    admin
      .from("students")
      .select("id,student_number,classroom_id,profiles!students_profile_id_fkey(first_name,last_name)")
      .in("classroom_id", classroomIds)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("student_number")
  ]);

  const subjectsByClass = new Map<string, Set<string>>();
  for (const row of (subjectRows.data ?? []) as unknown as Array<{ classroom_id: string; academic_year_id: string | null; subjects: Relation<{ name: string }> }>) {
    const key = `${row.classroom_id}:${row.academic_year_id ?? ""}`;
    const set = subjectsByClass.get(key) ?? new Set<string>();
    const subject = one(row.subjects)?.name;
    if (subject) set.add(subject);
    subjectsByClass.set(key, set);
  }

  const studentsByClassroom = new Map<string, TeacherClassRoster["students"]>();
  for (const student of (studentRows.data ?? []) as unknown as Array<{ id: string; student_number: string; classroom_id: string; profiles: Relation<ProfileJoin> }>) {
    const profile = one(student.profiles);
    const rows = studentsByClassroom.get(student.classroom_id) ?? [];
    const firstName = profile?.first_name ?? "";
    const lastName = profile?.last_name ?? "";
    rows.push({
      id: student.id,
      studentNumber: student.student_number,
      firstName,
      lastName,
      name: profile ? `${firstName} ${lastName}` : student.student_number
    });
    studentsByClassroom.set(student.classroom_id, rows);
  }

  return classrooms
    .sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel, undefined, { numeric: true }))
    .map((classroom) => {
      const key = `${classroom.classroomId}:${classroom.academicYearId ?? ""}`;
      return {
        ...classroom,
        subjects: Array.from(subjectsByClass.get(key) ?? new Set<string>()).sort(),
        students: studentsByClassroom.get(classroom.classroomId) ?? []
      };
    });
}

export async function listMyNotifications() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id,title,body,read_at,created_at")
    .eq("recipient_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return ((data ?? []) as Array<{ id: string; title: string; body: string; read_at: string | null; created_at: string | null }>).map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    unread: !notification.read_at,
    createdAt: notification.created_at
  }));
}
