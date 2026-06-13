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
  }>).map((row) => ({
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
  }));
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
