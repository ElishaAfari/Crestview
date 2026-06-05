import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/features/auth/guards";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export type SelectOption = { id: string; label: string };

export async function listAdminFormOptions() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const [academicYears, classrooms, students, courses, gradeItems] = await Promise.all([
    admin.from("academic_years").select("id,name,is_current").is("deleted_at", null).order("start_date", { ascending: false }),
    admin.from("classrooms").select("id,name,grade_level").is("deleted_at", null).order("grade_level"),
    admin.from("students").select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)").is("deleted_at", null).order("student_number"),
    admin.from("courses").select("id,term,subjects(name),classrooms(name)").is("deleted_at", null).order("term"),
    admin.from("grade_items").select("id,title,courses(subjects(name),classrooms(name))").is("deleted_at", null).order("created_at", { ascending: false })
  ]);

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
    gradeItems: ((gradeItems.data ?? []) as unknown as Array<{ id: string; title: string; courses: Relation<{ subjects: Relation<{ name: string }>; classrooms: Relation<{ name: string }> }> }>).map((item) => {
      const course = one(item.courses);
      return { id: item.id, label: `${item.title} - ${one(course?.subjects)?.name ?? "Course"} ${one(course?.classrooms)?.name ?? ""}`.trim() };
    })
  };
}

export async function getAdminDashboardData() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [students, staff, invoicesOpen, invoicesAll, paidInvoices, attendance, admissions, recruitment, events, audit] = await Promise.all([
    admin.from("students").select("*", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("profiles").select("roles(name)", { count: "exact" }).is("deleted_at", null),
    admin.from("invoices").select("*", { count: "exact", head: true }).in("status", ["draft", "open", "overdue"]).is("deleted_at", null),
    admin.from("invoices").select("amount,status").is("deleted_at", null),
    admin.from("invoices").select("amount").eq("status", "paid").is("deleted_at", null),
    admin.from("attendance_records").select("status").eq("attendance_date", today).is("deleted_at", null),
    admin.from("admission_applications").select("*", { count: "exact", head: true }).in("status", ["submitted", "reviewing"]).is("deleted_at", null),
    admin.from("job_applications").select("*", { count: "exact", head: true }).in("status", ["submitted", "screening", "interview", "offer"]).is("deleted_at", null),
    admin.from("events").select("id,title,starts_at").is("deleted_at", null).neq("status", "cancelled").order("starts_at", { ascending: true }).limit(5),
    admin.from("audit_logs").select("action,table_name,created_at").order("created_at", { ascending: false }).limit(5)
  ]);
  const staffCount = ((staff.data ?? []) as unknown as Array<{ roles: Relation<{ name: string }> }>).filter((row) => {
    const role = one(row.roles)?.name;
    return role && !["student", "parent"].includes(role);
  }).length;
  const attendanceRows = attendance.data ?? [];
  const present = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;
  const attendanceRate = attendanceRows.length ? Math.round((present / attendanceRows.length) * 100) : 0;
  const invoiceTotal = (invoicesAll.data ?? []).reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const paidTotal = (paidInvoices.data ?? []).reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const collectionRate = invoiceTotal ? Math.round((paidTotal / invoiceTotal) * 100) : 0;

  return {
    metrics: {
      students: students.count ?? 0,
      staff: staffCount,
      openInvoices: invoicesOpen.count ?? 0,
      attendanceRate,
      collectionRate,
      openAdmissions: admissions.count ?? 0,
      openRecruitment: recruitment.count ?? 0
    },
    events: (events.data ?? []) as Array<{ id: string; title: string; starts_at: string }>,
    activity: (audit.data ?? []).map((item) => `${item.action} ${item.table_name}`).slice(0, 5)
  };
}

export async function listInvoices() {
  await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data } = await admin.from("invoices").select("id,invoice_number,amount,currency,status,due_date,students(student_number,profiles!students_profile_id_fkey(first_name,last_name))").is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
  return ((data ?? []) as unknown as Array<{
    id: string;
    invoice_number: string;
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
    .select("id,term,summary,created_at,students(student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as unknown as Array<{
    id: string;
    term: string;
    summary: string | null;
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
      createdAt: report.created_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(report.created_at)) : "Just now"
    };
  });
}

export async function listAdmissionApplicationsForAdmin() {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin
    .from("admission_applications")
    .select("id,applicant_first_name,applicant_last_name,applying_grade,guardian_email,guardian_phone,status,submitted_at,notes,source")
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
  }>).map((application) => ({
    id: application.id,
    applicant: `${application.applicant_first_name} ${application.applicant_last_name}`,
    applyingGrade: application.applying_grade,
    guardian: application.guardian_email,
    phone: application.guardian_phone ?? "Not provided",
    status: application.status,
    submittedAt: application.submitted_at ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.submitted_at)) : "Not recorded",
    notes: application.notes ?? "",
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
