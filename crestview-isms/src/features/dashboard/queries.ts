import "server-only";

import { requireRoles, requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;
type ProfileJoin = { first_name: string; last_name: string };
type SelectOption = { id: string; label: string };

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
  const { data } = await supabase.from("profiles").select("id,first_name,last_name,phone,roles(name)").order("last_name");
  const records = (data ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    roles: Relation<{ name: string }>;
  }>;
  const staffRoles = new Set(["teacher", "hr_staff", "finance_officer", "librarian", "it_support", "school_admin", "super_admin"]);

  return records.flatMap((profile) => {
    const role = one(profile.roles)?.name;
    return role && staffRoles.has(role)
      ? [{ id: profile.id, name: `${profile.first_name} ${profile.last_name}`, role: role.replaceAll("_", " "), phone: profile.phone ?? "Not provided" }]
      : [];
  });
}

export async function listAttendanceRecords() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("attendance_records").select("id,attendance_date,status,students(profiles!students_profile_id_fkey(first_name,last_name))").order("attendance_date", { ascending: false }).limit(50);
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

export async function listGrades() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("grades").select("id,score,comments,grade_items(title),students(profiles!students_profile_id_fkey(first_name,last_name))").order("created_at", { ascending: false }).limit(50);
  const records = (data ?? []) as unknown as Array<{
    id: string;
    score: number;
    comments: string | null;
    grade_items: Relation<{ title: string }>;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>;

  return records.map((record) => {
    const profile = one(one(record.students)?.profiles);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      assessment: one(record.grade_items)?.title ?? "Assessment",
      score: String(record.score),
      comments: record.comments ?? ""
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
    admin.from("grades").select("score,grade_items(max_score)").eq("student_id", student.id).is("deleted_at", null),
    admin.from("attendance_records").select("status").eq("student_id", student.id).is("deleted_at", null),
    courseQuery,
    admin.from("invoices").select("*", { count: "exact", head: true }).eq("student_id", student.id).in("status", ["draft", "open", "overdue"]).is("deleted_at", null),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("student_id", student.id).is("deleted_at", null)
  ]);

  const gradeRows = (grades.data ?? []) as unknown as Array<{ score: number; grade_items: Relation<{ max_score: number }> }>;
  const average = gradeRows.length
    ? Math.round(gradeRows.reduce((sum, row) => sum + (Number(row.score) / Number(one(row.grade_items)?.max_score ?? 100)) * 100, 0) / gradeRows.length)
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
  const { data: courses } = await admin.from("courses").select("id,classroom_id").eq("teacher_id", user.id).is("deleted_at", null);
  const courseRows = (courses ?? []) as Array<{ id: string; classroom_id: string }>;
  const courseIds = courseRows.map((course) => course.id);
  const classroomIds = Array.from(new Set(courseRows.map((course) => course.classroom_id).filter(Boolean)));
  const [assignments, grades, attendance] = await Promise.all([
    courseIds.length ? admin.from("assignments").select("*", { count: "exact", head: true }).in("course_id", courseIds).is("deleted_at", null) : Promise.resolve({ count: 0 }),
    courseIds.length ? admin.from("grades").select("grade_items!inner(course_id)", { count: "exact", head: true }).in("grade_items.course_id", courseIds).is("deleted_at", null) : Promise.resolve({ count: 0 }),
    courseIds.length ? admin.from("attendance_records").select("status").in("course_id", courseIds).eq("attendance_date", new Date().toISOString().slice(0, 10)).is("deleted_at", null) : Promise.resolve({ data: [] })
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
  const { data } = await admin.from("invoices").select("id,invoice_number,amount,currency,status,due_date,students(student_number,profiles!students_profile_id_fkey(first_name,last_name))").in("student_id", studentIds).is("deleted_at", null).order("due_date", { ascending: true });
  return ((data ?? []) as unknown as Array<{
    id: string;
    invoice_number: string;
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

export async function listTeacherFormOptions(): Promise<{ courses: SelectOption[]; gradeItems: SelectOption[]; students: SelectOption[]; classrooms: SelectOption[] }> {
  const { user } = await requireRoles(["teacher"]);
  const admin = createAdminClient();
  const { data: courses } = await admin.from("courses").select("id,term,classroom_id,subjects(name),classrooms(name,grade_level)").eq("teacher_id", user.id).is("deleted_at", null).order("term");
  const courseRows = (courses ?? []) as unknown as Array<{
    id: string;
    term: string;
    classroom_id: string;
    subjects: Relation<{ name: string }>;
    classrooms: Relation<{ name: string; grade_level: string }>;
  }>;
  const courseIds = courseRows.map((course) => course.id);
  const classroomIds = Array.from(new Set(courseRows.map((course) => course.classroom_id).filter(Boolean)));
  const [gradeItems, students] = await Promise.all([
    courseIds.length ? admin.from("grade_items").select("id,title,courses(subjects(name),classrooms(name))").in("course_id", courseIds).is("deleted_at", null).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    classroomIds.length ? admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").in("classroom_id", classroomIds).is("deleted_at", null).order("student_number") : Promise.resolve({ data: [] })
  ]);

  return {
    courses: courseRows.map((course) => ({
      id: course.id,
      label: `${one(course.subjects)?.name ?? "Course"} - ${one(course.classrooms)?.name ?? "Class"} (${course.term})`
    })),
    classrooms: courseRows.map((course) => ({
      id: course.classroom_id,
      label: `${one(course.classrooms)?.grade_level ?? "Class"} - ${one(course.classrooms)?.name ?? "Class"}`
    })),
    gradeItems: ((gradeItems.data ?? []) as unknown as Array<{ id: string; title: string; courses: Relation<{ subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }> }>).map((item) => {
      const course = one(item.courses);
      return { id: item.id, label: `${item.title} - ${one(course?.subjects)?.name ?? "Course"} ${one(course?.classrooms)?.name ?? ""}`.trim() };
    }),
    students: ((students.data ?? []) as unknown as Array<{ id: string; student_number: string; profiles: Relation<ProfileJoin> }>).map((student) => {
      const profile = one(student.profiles);
      return { id: student.id, label: `${profile ? `${profile.first_name} ${profile.last_name}` : "Student"} (${student.student_number})` };
    })
  };
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
