import "server-only";

import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function riskLabel(value: string) {
  if (value === "green") return "On track";
  if (value === "red") return "Needs support";
  return "Watch";
}

export type WorkflowTaskRow = {
  id: string;
  taskNumber: string;
  title: string;
  workflowKey: string;
  status: string;
  priority: string;
  dueAt: string;
  assignee: string;
  student: string;
  classroom: string;
  related: string;
};

export type Student360Row = {
  id: string;
  student: string;
  studentNumber: string;
  classroom: string;
  status: string;
  attendanceRate: number;
  attendance30: number;
  gradeAverage: number;
  lowGrades: number;
  openInvoices: number;
  openAmount: string;
  reports: number;
  notes: number;
  risk: string;
  riskLabel: string;
};

export type Student360Detail = {
  profile: Student360Row & {
    classroomId: string | null;
    totalAttendance: number;
    presentAttendance: number;
    absentAttendance: number;
    overdueInvoices: number;
    lastReportAt: string;
    lastNoteAt: string;
  };
  guardians: Array<{ id: string; name: string; email: string; phone: string; relationship: string }>;
  grades: Array<{ id: string; subject: string; term: string; classAssessment: string; examScore: string; total: number; gradeCode: string; remark: string; comments: string }>;
  attendance: Array<{ id: string; date: string; status: string; notes: string; recordedBy: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; title: string; student: string; amount: string; status: string; dueDate: string }>;
  reports: Array<{ id: string; student: string; academicYear: string; term: string; summary: string; status: string; downloadUrl: string; createdAt: string }>;
  notes: Array<{ id: string; type: string; title: string; body: string; visibility: string; createdBy: string; createdAt: string }>;
  tasks: WorkflowTaskRow[];
};

type ClassroomScopedClient = ReturnType<typeof createAdminClient>;

async function teacherClassroomIds(admin: ClassroomScopedClient, teacherId: string) {
  const [leadCourses, assignedCourses] = await Promise.all([
    admin.from("courses").select("classroom_id").eq("teacher_id", teacherId).is("deleted_at", null),
    admin.from("teacher_assignments").select("courses(classroom_id)").eq("teacher_id", teacherId).is("deleted_at", null)
  ]);
  return Array.from(new Set([
    ...((leadCourses.data ?? []) as Array<{ classroom_id: string | null }>).map((course) => course.classroom_id),
    ...((assignedCourses.data ?? []) as unknown as Array<{ courses: Relation<{ classroom_id: string | null }> }>).map((row) => one(row.courses)?.classroom_id)
  ].filter((id): id is string => Boolean(id))));
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value));
}

function moneyText(currency: string | null | undefined, amount: number | string | null | undefined) {
  return `${(currency ?? "GHS").toUpperCase()} ${Number(amount ?? 0).toLocaleString("en-GH")}`;
}

function mapStudent360Record(row: {
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  classroom_id?: string | null;
  classroom_name: string | null;
  grade_level: string | null;
  status: string;
  attendance_rate: number;
  attendance_rate_30_days: number;
  grade_average: number;
  low_grade_count: number;
  open_invoice_count: number;
  open_invoice_amount: number;
  report_count: number;
  note_count: number;
  risk_level: string;
}): Student360Row {
  return {
    id: row.student_id,
    student: `${row.first_name} ${row.last_name}`,
    studentNumber: row.student_number,
    classroom: row.classroom_name ? `${row.grade_level ?? "Class"} - ${row.classroom_name}` : "Unassigned",
    status: row.status,
    attendanceRate: Number(row.attendance_rate ?? 0),
    attendance30: Number(row.attendance_rate_30_days ?? 0),
    gradeAverage: Number(row.grade_average ?? 0),
    lowGrades: Number(row.low_grade_count ?? 0),
    openInvoices: Number(row.open_invoice_count ?? 0),
    openAmount: `GHS ${Number(row.open_invoice_amount ?? 0).toLocaleString("en-GH")}`,
    reports: Number(row.report_count ?? 0),
    notes: Number(row.note_count ?? 0),
    risk: row.risk_level,
    riskLabel: riskLabel(row.risk_level)
  };
}

export async function listWorkflowTasksForCurrentRole(limit = 80): Promise<WorkflowTaskRow[]> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "student", "parent", "hr_staff", "finance_officer", "librarian", "it_support"]);
  const admin = createAdminClient();
  const privileged = ["super_admin", "school_admin"].includes(role ?? "");
  const operationsStaff = ["teacher", "hr_staff", "finance_officer", "librarian", "it_support"].includes(role ?? "");

  let query = admin
    .from("workflow_task_overview")
    .select("id,task_number,title,workflow_key,status,priority,due_at,assigned_to,created_by,assignee_name,student_name,student_number,classroom_name,grade_level,related_table,related_record_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!privileged && !operationsStaff) {
    query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
  }

  const { data } = await query;
  return ((data ?? []) as Array<{
    id: string;
    task_number: string;
    title: string;
    workflow_key: string;
    status: string;
    priority: string;
    due_at: string | null;
    assignee_name: string | null;
    student_name: string | null;
    student_number: string | null;
    classroom_name: string | null;
    grade_level: string | null;
    related_table: string | null;
    related_record_id: string | null;
  }>).map((task) => ({
    id: task.id,
    taskNumber: task.task_number,
    title: task.title,
    workflowKey: task.workflow_key.replaceAll("_", " "),
    status: task.status,
    priority: task.priority,
    dueAt: formatDate(task.due_at),
    assignee: task.assignee_name ?? "Unassigned",
    student: task.student_name ? `${task.student_name}${task.student_number ? ` (${task.student_number})` : ""}` : "Not linked",
    classroom: task.classroom_name ? `${task.grade_level ?? "Class"} - ${task.classroom_name}` : "Not linked",
    related: task.related_table ? `${task.related_table}${task.related_record_id ? `/${task.related_record_id.slice(0, 8)}` : ""}` : "Manual"
  }));
}

export async function listAutomationRules() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("automation_rules")
    .select("id,name,event_key,scope,description,is_active,priority,last_triggered_at")
    .is("deleted_at", null)
    .order("priority", { ascending: true });

  return ((data ?? []) as Array<{
    id: string;
    name: string;
    event_key: string;
    scope: string;
    description: string | null;
    is_active: boolean;
    priority: number;
    last_triggered_at: string | null;
  }>).map((rule) => ({
    id: rule.id,
    name: rule.name,
    eventKey: rule.event_key,
    scope: rule.scope,
    description: rule.description ?? "Automation rule",
    status: rule.is_active ? "active" : "disabled",
    priority: String(rule.priority),
    lastTriggeredAt: formatDate(rule.last_triggered_at)
  }));
}

export async function getWorkflowSummary() {
  const tasks = await listWorkflowTasksForCurrentRole(500);
  const open = tasks.filter((task) => ["open", "in_progress", "blocked"].includes(task.status));
  return {
    total: tasks.length,
    open: open.length,
    urgent: open.filter((task) => task.priority === "urgent").length,
    blocked: open.filter((task) => task.status === "blocked").length,
    completed: tasks.filter((task) => task.status === "completed").length
  };
}

export async function listStudent360Overview(): Promise<Student360Row[]> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff"]);
  const admin = createAdminClient();
  let classroomIds: string[] | null = null;
  if (role === "teacher") {
    classroomIds = await teacherClassroomIds(admin, user.id);
    if (!classroomIds.length) return [];
  }

  let query = admin
    .from("student_360_overview")
    .select("student_id,student_number,first_name,last_name,classroom_name,grade_level,status,attendance_rate,attendance_rate_30_days,grade_average,low_grade_count,open_invoice_count,open_invoice_amount,report_count,note_count,risk_level")
    .order("risk_level", { ascending: false })
    .limit(300);
  if (classroomIds) query = query.in("classroom_id", classroomIds);

  const { data } = await query;
  return ((data ?? []) as Array<{
    student_id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    classroom_name: string | null;
    grade_level: string | null;
    status: string;
    attendance_rate: number;
    attendance_rate_30_days: number;
    grade_average: number;
    low_grade_count: number;
    open_invoice_count: number;
    open_invoice_amount: number;
    report_count: number;
    note_count: number;
    risk_level: string;
  }>).map(mapStudent360Record);
}

export async function getStudent360Detail(studentId: string): Promise<Student360Detail | null> {
  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff"]);
  const admin = createAdminClient();
  const { data: overviewData } = await admin
    .from("student_360_overview")
    .select("student_id,student_number,first_name,last_name,classroom_id,classroom_name,grade_level,status,total_attendance,present_attendance,absent_attendance,attendance_rate,attendance_rate_30_days,grade_count,grade_average,low_grade_count,open_invoice_count,open_invoice_amount,overdue_invoice_count,report_count,last_report_at,note_count,last_note_at,risk_level")
    .eq("student_id", studentId)
    .maybeSingle();

  const overview = overviewData as {
    student_id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    classroom_id: string | null;
    classroom_name: string | null;
    grade_level: string | null;
    status: string;
    total_attendance: number;
    present_attendance: number;
    absent_attendance: number;
    attendance_rate: number;
    attendance_rate_30_days: number;
    grade_average: number;
    low_grade_count: number;
    open_invoice_count: number;
    open_invoice_amount: number;
    overdue_invoice_count: number;
    report_count: number;
    last_report_at: string | null;
    note_count: number;
    last_note_at: string | null;
    risk_level: string;
  } | null;

  if (!overview) return null;
  if (role === "teacher") {
    const classroomIds = await teacherClassroomIds(admin, user.id);
    if (!overview.classroom_id || !classroomIds.includes(overview.classroom_id)) return null;
  }

  const [guardianResult, gradeResult, attendanceResult, invoiceResult, reportResult, noteResult, taskResult] = await Promise.all([
    admin
      .from("parent_students")
      .select("relationship,profiles!parent_students_parent_profile_id_fkey(id,first_name,last_name,email,phone)")
      .eq("student_id", studentId)
      .is("deleted_at", null),
    admin
      .from("grades")
      .select("id,score,percentage,total_score,grade_code,remark,comments,assignment_score,quiz_score,midterm_score,class_assessment_score,exam_score,subject_name,term_label,grade_items(title,courses(subjects(name),classrooms(name)))")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("attendance_records")
      .select("id,attendance_date,status,notes,profiles!attendance_records_recorded_by_fkey(first_name,last_name)")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("attendance_date", { ascending: false })
      .limit(40),
    admin
      .from("invoices")
      .select("id,invoice_number,title,amount,currency,status,due_date")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("due_date", { ascending: false })
      .limit(30),
    admin
      .from("reports")
      .select("id,term,summary,status,report_url,created_at,academic_years(name)")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("student_360_notes")
      .select("id,note_type,title,body,visibility,created_at,profiles!student_360_notes_created_by_fkey(first_name,last_name)")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("workflow_task_overview")
      .select("id,task_number,title,workflow_key,status,priority,due_at,assignee_name,student_name,student_number,classroom_name,grade_level,related_table,related_record_id")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  type ProfileRow = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };
  const guardians = ((guardianResult.data ?? []) as unknown as Array<{ relationship: string; profiles: Relation<ProfileRow> }>)
    .flatMap((link) => {
      const profile = one(link.profiles);
      return profile ? [{
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email ?? "No email",
        phone: profile.phone ?? "No phone",
        relationship: link.relationship
      }] : [];
    });

  const grades = ((gradeResult.data ?? []) as unknown as Array<{
    id: string;
    score: number;
    percentage: number | null;
    total_score: number | null;
    grade_code: string | null;
    remark: string | null;
    comments: string | null;
    class_assessment_score: number | null;
    exam_score: number | null;
    subject_name: string | null;
    term_label: string | null;
    grade_items: Relation<{ title: string; courses: Relation<{ subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }> }>;
  }>).map((grade) => {
    const gradeItem = one(grade.grade_items);
    const course = one(gradeItem?.courses);
    const total = Number(grade.total_score ?? grade.percentage ?? grade.score ?? 0);
    return {
      id: grade.id,
      subject: grade.subject_name ?? one(course?.subjects)?.name ?? gradeItem?.title ?? "Subject",
      term: grade.term_label ?? "Term",
      classAssessment: grade.class_assessment_score !== null ? `${Number(grade.class_assessment_score).toFixed(1)}/30` : "-",
      examScore: grade.exam_score !== null ? `${Number(grade.exam_score).toFixed(1)}/70` : "-",
      total,
      gradeCode: grade.grade_code ?? "-",
      remark: grade.remark ?? "-",
      comments: grade.comments ?? ""
    };
  });

  const attendance = ((attendanceResult.data ?? []) as unknown as Array<{
    id: string;
    attendance_date: string;
    status: string;
    notes: string | null;
    profiles: Relation<{ first_name: string; last_name: string }>;
  }>).map((record) => {
    const recorder = one(record.profiles);
    return {
      id: record.id,
      date: record.attendance_date,
      status: record.status,
      notes: record.notes ?? "-",
      recordedBy: recorder ? `${recorder.first_name} ${recorder.last_name}` : "Not recorded"
    };
  });

  const invoices = ((invoiceResult.data ?? []) as Array<{ id: string; invoice_number: string; title: string | null; amount: number; currency: string; status: string; due_date: string }>).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    title: invoice.title ?? "School fees",
    student: `${overview.first_name} ${overview.last_name}`,
    amount: moneyText(invoice.currency, invoice.amount),
    status: invoice.status,
    dueDate: invoice.due_date
  }));

  const reports = ((reportResult.data ?? []) as unknown as Array<{
    id: string;
    term: string;
    summary: string | null;
    status: string | null;
    report_url: string | null;
    created_at: string | null;
    academic_years: Relation<{ name: string }>;
  }>).map((report) => ({
    id: report.id,
    student: `${overview.first_name} ${overview.last_name}`,
    academicYear: one(report.academic_years)?.name ?? "Academic year",
    term: report.term,
    summary: report.summary ?? "Ready for review",
    status: report.status ?? "draft",
    downloadUrl: report.report_url ?? `/api/reports/${report.id}/pdf`,
    createdAt: formatDateOnly(report.created_at)
  }));

  const notes = ((noteResult.data ?? []) as unknown as Array<{
    id: string;
    note_type: string;
    title: string;
    body: string;
    visibility: string;
    created_at: string | null;
    profiles: Relation<{ first_name: string; last_name: string }>;
  }>).map((note) => {
    const creator = one(note.profiles);
    return {
      id: note.id,
      type: note.note_type,
      title: note.title,
      body: note.body,
      visibility: note.visibility,
      createdBy: creator ? `${creator.first_name} ${creator.last_name}` : "School team",
      createdAt: formatDate(note.created_at)
    };
  });

  const tasks = ((taskResult.data ?? []) as Array<{
    id: string;
    task_number: string;
    title: string;
    workflow_key: string;
    status: string;
    priority: string;
    due_at: string | null;
    assignee_name: string | null;
    student_name: string | null;
    student_number: string | null;
    classroom_name: string | null;
    grade_level: string | null;
    related_table: string | null;
    related_record_id: string | null;
  }>).map((task) => ({
    id: task.id,
    taskNumber: task.task_number,
    title: task.title,
    workflowKey: task.workflow_key.replaceAll("_", " "),
    status: task.status,
    priority: task.priority,
    dueAt: formatDate(task.due_at),
    assignee: task.assignee_name ?? "Unassigned",
    student: task.student_name ? `${task.student_name}${task.student_number ? ` (${task.student_number})` : ""}` : "Not linked",
    classroom: task.classroom_name ? `${task.grade_level ?? "Class"} - ${task.classroom_name}` : "Not linked",
    related: task.related_table ? `${task.related_table}${task.related_record_id ? `/${task.related_record_id.slice(0, 8)}` : ""}` : "Manual"
  }));

  return {
    profile: {
      ...mapStudent360Record(overview),
      classroomId: overview.classroom_id,
      totalAttendance: Number(overview.total_attendance ?? 0),
      presentAttendance: Number(overview.present_attendance ?? 0),
      absentAttendance: Number(overview.absent_attendance ?? 0),
      overdueInvoices: Number(overview.overdue_invoice_count ?? 0),
      lastReportAt: formatDate(overview.last_report_at),
      lastNoteAt: formatDate(overview.last_note_at)
    },
    guardians,
    grades,
    attendance,
    invoices,
    reports,
    notes,
    tasks
  };
}

export async function listTaskFormOptions() {
  await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff", "finance_officer", "librarian", "it_support"]);
  const admin = createAdminClient();
  const [profiles, students, classrooms] = await Promise.all([
    admin.from("profiles").select("id,first_name,last_name,roles(name)").eq("is_active", true).is("deleted_at", null).order("last_name"),
    admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").eq("status", "active").is("deleted_at", null).order("student_number").limit(300),
    admin.from("classrooms").select("id,name,grade_level").is("deleted_at", null).order("grade_level")
  ]);
  const staffRoles = new Set(["super_admin", "school_admin", "teacher", "hr_staff", "finance_officer", "librarian", "it_support"]);
  return {
    assignees: ((profiles.data ?? []) as unknown as Array<{ id: string; first_name: string; last_name: string; roles: Relation<{ name: string }> }>)
      .filter((profile) => staffRoles.has(one(profile.roles)?.name ?? ""))
      .map((profile) => ({ id: profile.id, label: `${profile.first_name} ${profile.last_name} (${(one(profile.roles)?.name ?? "staff").replaceAll("_", " ")})` })),
    students: ((students.data ?? []) as unknown as Array<{ id: string; student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>)
      .map((student) => {
        const profile = one(student.profiles);
        return { id: student.id, label: `${profile ? `${profile.first_name} ${profile.last_name}` : "Student"} (${student.student_number})` };
      }),
    classrooms: ((classrooms.data ?? []) as Array<{ id: string; name: string; grade_level: string }>).map((classroom) => ({
      id: classroom.id,
      label: `${classroom.grade_level} - ${classroom.name}`
    }))
  };
}
