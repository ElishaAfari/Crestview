import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/features/auth/guards";
import type { Json } from "@/types/database.types";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export type SelectOption = { id: string; label: string };
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
export type GradingScaleRow = {
  id: string;
  code: string;
  label: string;
  minPercentage: number;
  maxPercentage: number;
  remark: string;
  points: number | null;
  isPassing: boolean;
};
export type AdminDashboardData = {
  metrics: {
    students: number;
    staff: number;
    openInvoices: number;
    attendanceRate: number;
    collectionRate: number;
    openAdmissions: number;
    openRecruitment: number;
    paidAmount: number;
    openAmount: number;
    invoiceTotal: number;
    openTasks: number;
    atRiskStudents: number;
  };
  attendanceSeries: Array<{ date: string; present: number; absent: number; rate: number }>;
  attendanceBreakdown: Array<{ label: string; count: number; tone: "green" | "amber" | "red" | "blue" }>;
  financeSeries: Array<{ month: string; collected: number; pending: number }>;
  classLoad: Array<{ className: string; students: number; capacity: number }>;
  roleCounts: Array<{ label: string; count: number }>;
  reviewQueues: Array<{ label: string; count: number; href: string; tone: "blue" | "green" | "amber" | "red" }>;
  events: Array<{ id: string; title: string; starts_at: string }>;
  activity: string[];
  activityItems: Array<{ label: string; table: string; createdAt: string | null }>;
};
export type DailyFeePlanRow = {
  id: string;
  className: string;
  amount: string;
  rawAmount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  notes: string;
};
export type DailyFeePaymentRow = {
  id: string;
  student: string;
  studentNumber: string;
  classroom: string;
  paymentDate: string;
  amount: string;
  method: string;
  status: string;
  reference: string;
  recordedBy: string;
  notes: string;
};
export type StudentIdCardRow = {
  id: string;
  studentId: string;
  student: string;
  studentNumber: string;
  classroom: string;
  cardNumber: string;
  qrPayload: string;
  status: string;
  issuedAt: string;
};

export async function listAdminFormOptions() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const [academicYears, classrooms, students, courses, gradeItems] = await Promise.all([
    admin.from("academic_years").select("id,name,is_current").is("deleted_at", null).order("start_date", { ascending: false }),
    admin.from("classrooms").select("id,name,grade_level").is("deleted_at", null).order("grade_level"),
    admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").is("deleted_at", null).order("student_number"),
    admin.from("courses").select("id,term,subjects(name),classrooms(name)").is("deleted_at", null).order("term"),
    admin.from("grade_items").select("id,title,category,max_score,courses(id,classroom_id,term,subjects(name),classrooms(id,name,grade_level))").is("deleted_at", null).order("created_at", { ascending: false })
  ]);
  const gradeItemRows = (gradeItems.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    category: string;
    max_score: number | null;
    courses: Relation<{ id?: string; classroom_id?: string; term?: string; subjects: Relation<{ name: string }>; classrooms: Relation<{ id?: string; name: string; grade_level?: string }> }>;
  }>;
  const importRows = gradeItemRows.filter((item) => item.category === "term_report" || Number(item.max_score ?? 100) === 100);
  const gradeItemClassroomIds = Array.from(new Set(importRows.map((item) => one(item.courses)?.classroom_id).filter((id): id is string => Boolean(id))));
  const { data: gradeImportStudents } = gradeItemClassroomIds.length
    ? await admin
        .from("students")
        .select("id,student_number,classroom_id,profiles!students_profile_id_fkey(first_name,last_name)")
        .in("classroom_id", gradeItemClassroomIds)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("student_number")
    : { data: [] };
  const studentsByClassroom = new Map<string, GradeImportStudent[]>();
  for (const student of (gradeImportStudents ?? []) as unknown as Array<{ id: string; student_number: string; classroom_id: string; profiles: Relation<{ first_name: string; last_name: string }> }>) {
    const profile = one(student.profiles);
    const rows = studentsByClassroom.get(student.classroom_id) ?? [];
    rows.push({
      id: student.id,
      studentNumber: student.student_number,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number
    });
    studentsByClassroom.set(student.classroom_id, rows);
  }

  return {
    academicYears: ((academicYears.data ?? []) as unknown as Array<{ id: string; name: string; is_current: boolean | null }>).map((item) => ({
      id: item.id,
      label: item.is_current ? `${item.name} (current)` : item.name
    })),
    classrooms: ((classrooms.data ?? []) as unknown as Array<{ id: string; name: string; grade_level: string }>).map((item) => ({
      id: item.id,
      label: `${item.grade_level} - ${item.name}`
    })),
    students: ((students.data ?? []) as unknown as Array<{ id: string; student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>).map((item) => {
      const profile = one(item.profiles);
      return { id: item.id, label: `${profile ? `${profile.first_name} ${profile.last_name}` : "Student"} (${item.student_number})` };
    }),
    courses: ((courses.data ?? []) as unknown as Array<{ id: string; term: string; subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }>).map((item) => ({
      id: item.id,
      label: `${one(item.subjects)?.name ?? "Course"} - ${one(item.classrooms)?.name ?? "Class"} (${item.term})`
    })),
    gradeItems: gradeItemRows.map((item) => {
      const course = one(item.courses);
      return { id: item.id, label: `${item.title} - ${one(course?.subjects)?.name ?? "Course"} ${one(course?.classrooms)?.name ?? ""}`.trim() };
    }),
    gradeImportContexts: importRows.map((item) => {
      const course = one(item.courses);
      const classroom = one(course?.classrooms);
      const subject = one(course?.subjects);
      const classroomId = course?.classroom_id ?? classroom?.id ?? "";
      return {
        gradeItemId: item.id,
        label: `${classroom?.name ?? "Class"} - ${subject?.name ?? "Subject"} - ${course?.term ?? "Term"} - ${item.title}`,
        courseId: course?.id ?? "",
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

export async function listFinanceFormOptions() {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const [classrooms, students] = await Promise.all([
    admin.from("classrooms").select("id,name,grade_level").is("deleted_at", null).order("grade_level"),
    admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").eq("status", "active").is("deleted_at", null).order("student_number")
  ]);

  return {
    classrooms: ((classrooms.data ?? []) as unknown as Array<{ id: string; name: string; grade_level: string }>).map((item) => ({
      id: item.id,
      label: `${item.grade_level} - ${item.name}`
    })),
    students: ((students.data ?? []) as unknown as Array<{ id: string; student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>).map((item) => {
      const profile = one(item.profiles);
      return { id: item.id, label: `${profile ? `${profile.first_name} ${profile.last_name}` : "Student"} (${item.student_number})` };
    })
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function money(value: unknown) {
  return Number(value ?? 0);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GH", { month: "short" }).format(date);
}

function roleLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const [students, staff, classrooms, invoicesAll, dailyFeesAll, attendance, admissions, recruitment, events, audit, tasks, student360] = await Promise.all([
    admin.from("students").select("id,classroom_id,status").eq("status", "active").is("deleted_at", null),
    admin.from("profiles").select("roles(name)").is("deleted_at", null),
    admin.from("classrooms").select("id,name,grade_level,capacity").is("deleted_at", null).order("grade_level"),
    admin.from("invoices").select("amount,status,created_at").is("deleted_at", null),
    admin.from("daily_fee_payments").select("amount,status,payment_date,created_at").is("deleted_at", null),
    admin.from("attendance_records").select("status,attendance_date").gte("attendance_date", dateKey(weekStart)).is("deleted_at", null),
    admin.from("admission_applications").select("status").is("deleted_at", null),
    admin.from("job_applications").select("status").is("deleted_at", null),
    admin.from("events").select("id,title,starts_at").is("deleted_at", null).neq("status", "cancelled").order("starts_at", { ascending: true }).limit(8),
    admin.from("audit_logs").select("action,table_name,created_at").order("created_at", { ascending: false }).limit(7),
    admin.from("workflow_tasks").select("status").is("deleted_at", null),
    admin.from("student_360_overview").select("risk_level")
  ]);
  const studentRows = (students.data ?? []) as Array<{ id: string; classroom_id: string | null; status: string }>;
  const staffCount = ((staff.data ?? []) as unknown as Array<{ roles: Relation<{ name: string }> }>).filter((row) => {
    const role = one(row.roles)?.name;
    return role && !["student", "parent"].includes(role);
  }).length;
  const attendanceRows = (attendance.data ?? []) as Array<{ status: string; attendance_date: string }>;
  const todayRows = attendanceRows.filter((row) => row.attendance_date === today);
  const present = todayRows.filter((row) => row.status === "present" || row.status === "late").length;
  const attendanceRate = todayRows.length ? Math.round((present / todayRows.length) * 100) : 0;
  const invoiceRows = (invoicesAll.data ?? []) as Array<{ amount: number | null; status: string; created_at: string | null }>;
  const dailyFeeRows = (dailyFeesAll.data ?? []) as Array<{ amount: number | null; status: string; payment_date: string; created_at: string | null }>;
  const dailyFeeCollectedTotal = dailyFeeRows
    .filter((payment) => payment.status === "paid" || payment.status === "waived")
    .reduce((sum, payment) => sum + money(payment.amount), 0);
  const invoiceTotal = invoiceRows.reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const paidTotal = invoiceRows.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const openAmount = invoiceRows.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const financeTotal = invoiceTotal + dailyFeeCollectedTotal;
  const collectionRate = financeTotal ? Math.round(((paidTotal + dailyFeeCollectedTotal) / financeTotal) * 100) : 0;
  const admissionRows = (admissions.data ?? []) as Array<{ status: string }>;
  const recruitmentRows = (recruitment.data ?? []) as Array<{ status: string }>;
  const taskRows = (tasks.data ?? []) as Array<{ status: string }>;
  const student360Rows = (student360.data ?? []) as Array<{ risk_level: string }>;
  const openAdmissionStatuses = new Set(["submitted", "reviewing"]);
  const openRecruitmentStatuses = new Set(["submitted", "screening", "interview", "offer"]);
  const roleCountsMap = new Map<string, number>();
  for (const row of (staff.data ?? []) as unknown as Array<{ roles: Relation<{ name: string }> }>) {
    const roleName = one(row.roles)?.name;
    if (!roleName || ["student", "parent"].includes(roleName)) continue;
    roleCountsMap.set(roleName, (roleCountsMap.get(roleName) ?? 0) + 1);
  }

  const attendanceSeries = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);
    const key = dateKey(current);
    const rows = attendanceRows.filter((row) => row.attendance_date === key);
    const dayPresent = rows.filter((row) => row.status === "present" || row.status === "late").length;
    const dayAbsent = rows.filter((row) => row.status === "absent").length;
    return {
      date: new Intl.DateTimeFormat("en-GH", { weekday: "short" }).format(current),
      present: dayPresent,
      absent: dayAbsent,
      rate: rows.length ? Math.round((dayPresent / rows.length) * 100) : 0
    };
  });

  const statusCounts = new Map<string, number>();
  for (const row of todayRows) statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);

  const monthSeeds = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, month: monthLabel(date), collected: 0, pending: 0 };
  });
  const financeByMonth = new Map(monthSeeds.map((item) => [item.key, item]));
  for (const invoice of invoiceRows) {
    if (!invoice.created_at) continue;
    const created = new Date(invoice.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = financeByMonth.get(key);
    if (!bucket) continue;
    if (invoice.status === "paid") bucket.collected += money(invoice.amount);
    else bucket.pending += money(invoice.amount);
  }
  for (const payment of dailyFeeRows) {
    const created = new Date(payment.payment_date);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = financeByMonth.get(key);
    if (!bucket) continue;
    if (payment.status === "paid" || payment.status === "waived") bucket.collected += money(payment.amount);
  }

  const classCounts = new Map<string, number>();
  for (const student of studentRows) {
    if (student.classroom_id) classCounts.set(student.classroom_id, (classCounts.get(student.classroom_id) ?? 0) + 1);
  }

  return {
    metrics: {
      students: studentRows.length,
      staff: staffCount,
      openInvoices: invoiceRows.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).length,
      attendanceRate,
      collectionRate,
      openAdmissions: admissionRows.filter((row) => openAdmissionStatuses.has(row.status)).length,
      openRecruitment: recruitmentRows.filter((row) => openRecruitmentStatuses.has(row.status)).length,
      paidAmount: paidTotal + dailyFeeCollectedTotal,
      openAmount,
      invoiceTotal: financeTotal,
      openTasks: taskRows.filter((task) => ["open", "in_progress", "blocked"].includes(task.status)).length,
      atRiskStudents: student360Rows.filter((student) => student.risk_level !== "green").length
    },
    attendanceSeries,
    attendanceBreakdown: [
      { label: "Present", count: statusCounts.get("present") ?? 0, tone: "green" },
      { label: "Late", count: statusCounts.get("late") ?? 0, tone: "amber" },
      { label: "Absent", count: statusCounts.get("absent") ?? 0, tone: "red" },
      { label: "Excused", count: statusCounts.get("excused") ?? 0, tone: "blue" }
    ],
    financeSeries: Array.from(financeByMonth.values()).map(({ month, collected, pending }) => ({ month, collected, pending })),
    classLoad: ((classrooms.data ?? []) as Array<{ id: string; name: string; grade_level: string; capacity: number | null }>)
      .map((classroom) => ({
        className: classroom.name,
        students: classCounts.get(classroom.id) ?? 0,
        capacity: classroom.capacity ?? 35
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 8),
    roleCounts: Array.from(roleCountsMap.entries()).map(([label, count]) => ({ label: roleLabel(label), count })).sort((a, b) => b.count - a.count),
    reviewQueues: [
      { label: "Admissions", count: admissionRows.filter((row) => openAdmissionStatuses.has(row.status)).length, href: "/admin/admissions", tone: "blue" },
      { label: "Recruitment", count: recruitmentRows.filter((row) => openRecruitmentStatuses.has(row.status)).length, href: "/admin/recruitment", tone: "amber" },
      { label: "Open invoices", count: invoiceRows.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).length, href: "/admin/fees", tone: "green" },
      { label: "Workflow tasks", count: taskRows.filter((task) => ["open", "in_progress", "blocked"].includes(task.status)).length, href: "/admin/automation", tone: "red" }
    ],
    events: (events.data ?? []) as Array<{ id: string; title: string; starts_at: string }>,
    activity: (audit.data ?? []).map((item) => `${item.action} ${item.table_name}`).slice(0, 5),
    activityItems: ((audit.data ?? []) as Array<{ action: string; table_name: string; created_at: string | null }>).map((item) => ({
      label: item.action,
      table: item.table_name,
      createdAt: item.created_at
    }))
  };
}

export async function listInvoices() {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data } = await admin.from("invoices").select("id,invoice_number,title,amount,currency,status,due_date,students(student_number,profiles!students_profile_id_fkey(first_name,last_name))").is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
  return ((data ?? []) as unknown as Array<{
    id: string;
    invoice_number: string;
    title: string | null;
    amount: number;
    currency: string;
    status: string;
    due_date: string;
    students: Relation<{ student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>;
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

export async function listDailyFeePlans(): Promise<DailyFeePlanRow[]> {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("daily_fee_plans")
    .select("id,name,amount,currency,effective_from,effective_to,is_active,notes,classrooms(name,grade_level)")
    .is("deleted_at", null)
    .order("effective_from", { ascending: false })
    .limit(100);

  return ((data ?? []) as unknown as Array<{
    id: string;
    name: string;
    amount: number;
    currency: string;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean | null;
    notes: string | null;
    classrooms: Relation<{ name: string; grade_level: string }>;
  }>).map((plan) => {
    const classroom = one(plan.classrooms);
    return {
      id: plan.id,
      className: classroom ? `${classroom.grade_level} - ${classroom.name}` : "Class",
      amount: `${plan.currency} ${Number(plan.amount).toLocaleString("en-GH")}`,
      rawAmount: Number(plan.amount),
      currency: plan.currency,
      effectiveFrom: plan.effective_from,
      effectiveTo: plan.effective_to ?? "Until changed",
      status: plan.is_active ? "active" : "inactive",
      notes: plan.notes ?? plan.name
    };
  });
}

export async function listDailyFeePayments(): Promise<DailyFeePaymentRow[]> {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("daily_fee_payments")
    .select("id,payment_date,student_number,amount,currency,method,status,reference,notes,students(profiles!students_profile_id_fkey(first_name,last_name)),classrooms(name,grade_level),profiles!daily_fee_payments_recorded_by_fkey(first_name,last_name)")
    .is("deleted_at", null)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(150);

  return ((data ?? []) as unknown as Array<{
    id: string;
    payment_date: string;
    student_number: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    reference: string;
    notes: string | null;
    students: Relation<{ profiles: Relation<{ first_name: string; last_name: string }> }>;
    classrooms: Relation<{ name: string; grade_level: string }>;
    profiles: Relation<{ first_name: string; last_name: string }>;
  }>).map((payment) => {
    const profile = one(one(payment.students)?.profiles);
    const classroom = one(payment.classrooms);
    const recorder = one(payment.profiles);
    return {
      id: payment.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : payment.student_number,
      studentNumber: payment.student_number,
      classroom: classroom ? `${classroom.grade_level} - ${classroom.name}` : "Unassigned",
      paymentDate: payment.payment_date,
      amount: `${payment.currency} ${Number(payment.amount).toLocaleString("en-GH")}`,
      method: payment.method.replaceAll("_", " "),
      status: payment.status,
      reference: payment.reference,
      recordedBy: recorder ? `${recorder.first_name} ${recorder.last_name}` : "Finance desk",
      notes: payment.notes ?? ""
    };
  });
}

export async function listStudentIdCards(): Promise<StudentIdCardRow[]> {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("student_id_cards")
    .select("id,card_number,student_number,qr_payload,status,issued_at,students(id,status,classrooms(name,grade_level),profiles!students_profile_id_fkey(first_name,last_name))")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("student_number")
    .limit(200);

  return ((data ?? []) as unknown as Array<{
    id: string;
    card_number: string;
    student_number: string;
    qr_payload: string;
    status: string;
    issued_at: string;
    students: Relation<{
      id: string;
      status: string;
      classrooms: Relation<{ name: string; grade_level: string }>;
      profiles: Relation<{ first_name: string; last_name: string }>;
    }>;
  }>).map((card) => {
    const student = one(card.students);
    const profile = one(student?.profiles);
    const classroom = one(student?.classrooms);
    return {
      id: card.id,
      studentId: student?.id ?? card.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : card.student_number,
      studentNumber: card.student_number,
      classroom: classroom ? `${classroom.grade_level} - ${classroom.name}` : "Unassigned",
      cardNumber: card.card_number,
      qrPayload: card.qr_payload,
      status: card.status,
      issuedAt: card.issued_at
    };
  });
}

export async function listEventsForAdmin() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin.from("events").select("id,title,location,starts_at,status").is("deleted_at", null).order("starts_at", { ascending: true }).limit(20);
  return ((data ?? []) as unknown as Array<{ id: string; title: string; location: string | null; starts_at: string; status: string }>).map((event) => ({
    id: event.id,
    title: event.title,
    location: event.location ?? "School campus",
    startsAt: new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.starts_at)),
    status: event.status
  }));
}

export async function listReportsForAdmin() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("reports")
    .select("id,term,summary,status,report_url,created_at,students(student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
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
    students: Relation<{ student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>;
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

export async function listAdmissionApplicationsForAdmin() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("admission_applications")
    .select("id,applicant_first_name,applicant_middle_name,applicant_last_name,applicant_date_of_birth,applicant_gender,applying_grade,guardian_email,guardian_phone,status,submitted_at,notes,source,generated_student_number,onboarding_notes,previous_school,applicant_address,metadata,admission_guardians(first_name,last_name,relationship,email,phone,is_primary),admission_documents(document_type,status)")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as unknown as Array<{
    id: string;
    applicant_first_name: string;
    applicant_middle_name: string | null;
    applicant_last_name: string;
    applicant_date_of_birth: string | null;
    applicant_gender: string | null;
    applying_grade: string;
    guardian_email: string;
    guardian_phone: string | null;
    status: string;
    submitted_at: string | null;
    notes: string | null;
    source: string | null;
    generated_student_number: string | null;
    onboarding_notes: string | null;
    previous_school: string | null;
    applicant_address: Json | null;
    metadata: Json | null;
    admission_guardians: Array<{ first_name: string; last_name: string; relationship: string; email: string | null; phone: string | null; is_primary: boolean | null }> | null;
    admission_documents: Array<{ document_type: string; status: string }> | null;
  }>).map((application) => {
    const address = application.applicant_address && typeof application.applicant_address === "object" && !Array.isArray(application.applicant_address) ? application.applicant_address : {};
    const metadata = application.metadata && typeof application.metadata === "object" && !Array.isArray(application.metadata) ? application.metadata : {};
    const emergency = typeof metadata.emergency_contact === "object" && !Array.isArray(metadata.emergency_contact) ? metadata.emergency_contact : null;
    const health = typeof metadata.health === "object" && !Array.isArray(metadata.health) ? metadata.health : null;
    const documents = application.admission_documents ?? [];
    return {
      id: application.id,
      applicant: [application.applicant_first_name, application.applicant_middle_name, application.applicant_last_name].filter(Boolean).join(" "),
      applyingGrade: application.applying_grade,
      dateOfBirth: application.applicant_date_of_birth ?? "Not provided",
      gender: application.applicant_gender?.replaceAll("_", " ") ?? "Not provided",
      address: [address.home_address, address.city, address.zip_code].filter(Boolean).join(", ") || "Not provided",
      previousSchool: application.previous_school ?? "Not provided",
      guardian: application.guardian_email,
      phone: application.guardian_phone ?? "Not provided",
      guardians: (application.admission_guardians ?? []).map((guardian) => ({
        name: `${guardian.first_name} ${guardian.last_name}`,
        relationship: guardian.relationship,
        email: guardian.email ?? "No email",
        phone: guardian.phone ?? "No phone",
        primary: Boolean(guardian.is_primary)
      })),
      emergencyContact: emergency ? [emergency.name, emergency.relationship, emergency.phone].filter(Boolean).join(" | ") : "Not provided",
      healthSummary: health
        ? [
            health.has_allergies ? `Allergies: ${health.allergies_details ?? "listed"}` : "No allergies noted",
            health.has_medical_conditions ? `Medical: ${health.medical_conditions_details ?? "listed"}` : "No medical conditions noted",
            health.health_insurance_number ? `NHIS: ${health.health_insurance_number}` : null
          ].filter(Boolean).join(" | ")
        : "Not provided",
      documents: documents.length ? documents.map((document) => `${document.document_type.replaceAll("_", " ")} (${document.status})`).join(", ") : "No documents marked",
      status: application.status,
      submittedAt: application.submitted_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.submitted_at)) : "Not recorded",
      notes: [application.notes, application.generated_student_number ? `Student ID: ${application.generated_student_number}` : null, application.onboarding_notes].filter(Boolean).join(" | "),
      source: application.source ?? "website"
    };
  });
}

export async function listJobApplicationsForAdmin() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("job_applications")
    .select("id,first_name,last_name,email,phone,cover_letter,status,submitted_at,job_postings(title,employment_type)")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    cover_letter: string | null;
    status: string;
    submitted_at: string | null;
    job_postings: Relation<{ title: string | null; employment_type: string | null }>;
  }>).map((application) => {
    const posting = one(application.job_postings);
    return {
      id: application.id,
      applicant: `${application.first_name} ${application.last_name}`,
      email: application.email,
      phone: application.phone ?? "Not provided",
      role: posting?.title ?? "Open application",
      employmentType: posting?.employment_type?.replaceAll("_", " ") ?? "Not specified",
      status: application.status,
      submittedAt: application.submitted_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.submitted_at)) : "Not recorded",
      coverLetter: application.cover_letter ?? ""
    };
  });
}

export async function listGradingScalesForAdmin(): Promise<GradingScaleRow[]> {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("grading_scales")
    .select("id,code,label,min_percentage,max_percentage,remark,points,is_passing")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return ((data ?? []) as Array<{
    id: string;
    code: string;
    label: string;
    min_percentage: number;
    max_percentage: number;
    remark: string;
    points: number | null;
    is_passing: boolean;
  }>).map((row) => ({
    id: row.id,
    code: row.code,
    label: row.label,
    minPercentage: Number(row.min_percentage),
    maxPercentage: Number(row.max_percentage),
    remark: row.remark,
    points: row.points === null ? null : Number(row.points),
    isPassing: row.is_passing
  }));
}
