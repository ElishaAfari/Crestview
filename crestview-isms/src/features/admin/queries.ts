import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/features/auth/guards";

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
  const [students, staff, classrooms, invoicesAll, attendance, admissions, recruitment, events, audit] = await Promise.all([
    admin.from("students").select("id,classroom_id,status").eq("status", "active").is("deleted_at", null),
    admin.from("profiles").select("roles(name)").is("deleted_at", null),
    admin.from("classrooms").select("id,name,grade_level,capacity").is("deleted_at", null).order("grade_level"),
    admin.from("invoices").select("amount,status,created_at").is("deleted_at", null),
    admin.from("attendance_records").select("status,attendance_date").gte("attendance_date", dateKey(weekStart)).is("deleted_at", null),
    admin.from("admission_applications").select("status").is("deleted_at", null),
    admin.from("job_applications").select("status").is("deleted_at", null),
    admin.from("events").select("id,title,starts_at").is("deleted_at", null).neq("status", "cancelled").order("starts_at", { ascending: true }).limit(8),
    admin.from("audit_logs").select("action,table_name,created_at").order("created_at", { ascending: false }).limit(7)
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
  const invoiceTotal = invoiceRows.reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const paidTotal = invoiceRows.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const openAmount = invoiceRows.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + money(invoice.amount), 0);
  const collectionRate = invoiceTotal ? Math.round((paidTotal / invoiceTotal) * 100) : 0;
  const admissionRows = (admissions.data ?? []) as Array<{ status: string }>;
  const recruitmentRows = (recruitment.data ?? []) as Array<{ status: string }>;
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
      paidAmount: paidTotal,
      openAmount,
      invoiceTotal
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
      { label: "Open invoices", count: invoiceRows.filter((invoice) => ["draft", "open", "overdue"].includes(invoice.status)).length, href: "/admin/fees", tone: "green" }
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
    .select("id,applicant_first_name,applicant_last_name,applying_grade,guardian_email,guardian_phone,status,submitted_at,notes,source,generated_student_number,onboarding_notes")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as Array<{
    id: string;
    applicant_first_name: string;
    applicant_last_name: string;
    applying_grade: string;
    guardian_email: string;
    guardian_phone: string | null;
    status: string;
    submitted_at: string | null;
    notes: string | null;
    source: string | null;
    generated_student_number: string | null;
    onboarding_notes: string | null;
  }>).map((application) => ({
    id: application.id,
    applicant: `${application.applicant_first_name} ${application.applicant_last_name}`,
    applyingGrade: application.applying_grade,
    guardian: application.guardian_email,
    phone: application.guardian_phone ?? "Not provided",
    status: application.status,
    submittedAt: application.submitted_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.submitted_at)) : "Not recorded",
    notes: [application.notes, application.generated_student_number ? `Student ID: ${application.generated_student_number}` : null, application.onboarding_notes].filter(Boolean).join(" | "),
    source: application.source ?? "website"
  }));
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
