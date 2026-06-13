import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const runId = process.env.BETA_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const betaMarker = { beta_test: true, beta_run_id: runId, source: "full-platform-beta" };
const report = {
  runId,
  startedAt: new Date().toISOString(),
  target: {},
  accounts: {},
  created: {},
  checks: [],
  failures: [],
  warnings: [],
  sampleCredentials: [],
};

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
  );
}

const env = { ...readDotEnv(path.join(cwd, ".env.local")), ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY for beta testing.");
}

report.target.projectUrl = new URL(supabaseUrl).host;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { "X-Crestview-Beta-Run": runId } },
});

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function plusDays(days) {
  const date = new Date(Date.UTC(2026, 5, 13));
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function isoPlusDays(days, hour = 9) {
  const date = new Date(Date.UTC(2026, 5, 13, hour, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function assertCheck(name, condition, details = {}) {
  const entry = { name, status: condition ? "pass" : "fail", details };
  report.checks.push(entry);
  if (!condition) report.failures.push(entry);
}

async function step(name, fn) {
  const startedAt = Date.now();
  process.stdout.write(`\n[beta:${runId}] ${name}... `);
  try {
    const result = await fn();
    report.created[name] = result ?? true;
    process.stdout.write(`ok (${Date.now() - startedAt}ms)`);
    return result;
  } catch (error) {
    const failure = { name, message: error.message, stack: error.stack };
    report.failures.push(failure);
    process.stdout.write("failed\n");
    throw error;
  }
}

async function dbSelect(table, query = "*") {
  const request = supabase.from(table).select(query);
  const { data, error } = await request;
  if (error) throw new Error(`${table} select failed: ${error.message}`);
  return data ?? [];
}

async function dbInsert(table, rows, options = {}) {
  const input = Array.isArray(rows) ? rows : [rows];
  if (!input.length) return [];
  const chunkSize = options.chunkSize || 500;
  const output = [];
  for (let index = 0; index < input.length; index += chunkSize) {
    const chunk = input.slice(index, index + chunkSize);
    const { data, error } = await supabase.from(table).insert(chunk).select(options.select || "*");
    if (error) throw new Error(`${table} insert failed: ${error.message}`);
    output.push(...(data ?? []));
  }
  return output;
}

async function dbUpsert(table, rows, options = {}) {
  const input = Array.isArray(rows) ? rows : [rows];
  if (!input.length) return [];
  const chunkSize = options.chunkSize || 500;
  const output = [];
  for (let index = 0; index < input.length; index += chunkSize) {
    const chunk = input.slice(index, index + chunkSize);
    const { data, error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: options.onConflict, ignoreDuplicates: false })
      .select(options.select || "*");
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    output.push(...(data ?? []));
  }
  return output;
}

async function countRows(table, filter) {
  let request = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) request = filter(request);
  const { count, error } = await request;
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function selectColumn(table, column, filter) {
  let request = supabase.from(table).select(column);
  if (filter) request = filter(request);
  const { data, error } = await request;
  if (error) throw new Error(`${table} cleanup select failed: ${error.message}`);
  return (data ?? []).map((row) => row[column]).filter(Boolean);
}

async function deleteWhere(table, filter) {
  let request = supabase.from(table).delete();
  request = filter(request);
  const { error } = await request;
  if (error) throw new Error(`${table} cleanup delete failed: ${error.message}`);
}

async function deleteByIn(table, column, values) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  for (let index = 0; index < uniqueValues.length; index += 100) {
    const chunk = uniqueValues.slice(index, index + 100);
    if (!chunk.length) continue;
    await deleteWhere(table, (query) => query.in(column, chunk));
  }
}

async function cleanupRun(cleanupRunId) {
  process.stdout.write(`[beta:${cleanupRunId}] cleanup started\n`);
  const academicYearIds = await selectColumn("academic_years", "id", (query) => query.eq("name", `Crestview Beta ${cleanupRunId}`));
  const profileIds = await selectColumn("profiles", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const studentIds = await selectColumn("students", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const staffProfileIds = await selectColumn("staff_profiles", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const courseIds = academicYearIds.length ? await selectColumn("courses", "id", (query) => query.in("academic_year_id", academicYearIds)) : [];
  const classroomIds = academicYearIds.length ? await selectColumn("classrooms", "id", (query) => query.in("academic_year_id", academicYearIds)) : [];
  const invoiceIds = await selectColumn("invoices", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const gradeItemIds = await selectColumn("grade_items", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const registerIds = await selectColumn("attendance_registers", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const jobApplicationIds = await selectColumn("job_applications", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const ticketIds = await selectColumn("support_tickets", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const campaignIds = await selectColumn("communication_campaigns", "id", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  const bookIds = await selectColumn("library_books", "id", (query) => query.ilike("isbn", `BETA-${cleanupRunId}-%`));
  const copyIds = bookIds.length ? await selectColumn("library_copies", "id", (query) => query.in("book_id", bookIds)) : [];
  const payrollPeriodIds = await selectColumn("payroll_periods", "id", (query) => query.ilike("name", `%${cleanupRunId}%`));
  const conversationIds = await selectColumn("conversations", "id", (query) => query.ilike("title", `%${cleanupRunId}%`));
  const messageIds = conversationIds.length ? await selectColumn("messages", "id", (query) => query.in("conversation_id", conversationIds)) : [];

  await deleteByIn("support_ticket_comments", "ticket_id", ticketIds);
  await deleteWhere("support_tickets", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("devices", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("library_loans", "copy_id", copyIds);
  await deleteByIn("library_copies", "book_id", bookIds);
  await deleteByIn("library_books", "id", bookIds);
  await deleteByIn("payroll_items", "payroll_period_id", payrollPeriodIds);
  await deleteByIn("payroll_periods", "id", payrollPeriodIds);
  await deleteByIn("staff_attendance_records", "staff_profile_id", staffProfileIds);
  await deleteByIn("leave_requests", "staff_profile_id", staffProfileIds);
  await deleteByIn("message_attachments", "message_id", messageIds);
  await deleteByIn("messages", "conversation_id", conversationIds);
  await deleteByIn("conversation_members", "conversation_id", conversationIds);
  await deleteByIn("conversations", "id", conversationIds);
  await deleteByIn("communication_recipients", "campaign_id", campaignIds);
  await deleteWhere("communication_recipients", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("communication_campaigns", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("workflow_tasks", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("student_360_notes", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("notifications", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("account_lifecycle_records", (query) => query.contains("snapshot", { beta_run_id: cleanupRunId }));
  await deleteByIn("ai_analytics", "student_id", studentIds);
  await deleteWhere("reports", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("grade_import_batches", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("grades", "grade_item_id", gradeItemIds);
  await deleteWhere("grade_items", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("attendance_records", "register_id", registerIds);
  await deleteWhere("attendance_registers", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("invoice_items", "invoice_id", invoiceIds);
  await deleteByIn("payments", "invoice_id", invoiceIds);
  await deleteWhere("invoices", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("billing_batches", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("job_application_status_history", "job_application_id", jobApplicationIds);
  await deleteWhere("job_applications", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteWhere("job_postings", (query) => query.ilike("title", `%Beta ${cleanupRunId}%`));
  await deleteWhere("admission_applications", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("student_documents", "student_id", studentIds);
  await deleteByIn("student_behavior_records", "student_id", studentIds);
  await deleteByIn("student_medical_records", "student_id", studentIds);
  await deleteByIn("student_enrollments", "student_id", studentIds);
  await deleteByIn("parent_students", "student_id", studentIds);
  await deleteByIn("students", "id", studentIds);
  await deleteWhere("class_roster_snapshots", (query) => query.in("academic_year_id", academicYearIds));
  await deleteWhere("staff_class_assignments", (query) => query.contains("metadata", { beta_run_id: cleanupRunId }));
  await deleteByIn("teacher_assignments", "course_id", courseIds);
  await deleteByIn("courses", "id", courseIds);
  await deleteByIn("classrooms", "id", classroomIds);
  await deleteWhere("terms", (query) => query.in("academic_year_id", academicYearIds));
  await deleteByIn("staff_profiles", "id", staffProfileIds);

  for (const profileId of profileIds) {
    const { error } = await supabase.auth.admin.deleteUser(profileId);
    if (error && !/User not found/i.test(error.message)) throw new Error(`auth cleanup failed for ${profileId}: ${error.message}`);
  }

  await deleteByIn("academic_years", "id", academicYearIds);
  process.stdout.write(`[beta:${cleanupRunId}] cleanup removed ${profileIds.length} profiles and ${studentIds.length} students\n`);
}

function initials(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 8);
}

function stableCode(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function gradeFor(total) {
  if (total >= 75) return { code: "A1", remark: "Excellent", points: 1, passing: true };
  if (total >= 70) return { code: "B2", remark: "Very good", points: 2, passing: true };
  if (total >= 65) return { code: "B3", remark: "Good", points: 3, passing: true };
  if (total >= 60) return { code: "C4", remark: "Credit", points: 4, passing: true };
  if (total >= 55) return { code: "C5", remark: "Credit", points: 5, passing: true };
  if (total >= 50) return { code: "C6", remark: "Credit", points: 6, passing: true };
  if (total >= 45) return { code: "D7", remark: "Pass", points: 7, passing: true };
  if (total >= 40) return { code: "E8", remark: "Pass", points: 8, passing: true };
  return { code: "F9", remark: "Needs intensive support", points: 9, passing: false };
}

const rolesToCreate = [
  ["super_admin", "Super Admin", "Unrestricted platform administrator"],
  ["school_admin", "School Admin", "School-wide administrative access"],
  ["teacher", "Teacher", "Classroom and academic delivery"],
  ["student", "Student", "Learner portal access"],
  ["parent", "Parent", "Guardian portal access"],
  ["hr_staff", "HR Staff", "Recruitment and payroll operations"],
  ["finance_officer", "Finance Officer", "Fees, invoices, and payments"],
  ["librarian", "Librarian", "Library and resource management"],
  ["it_support", "IT Support", "Technical support and system health"],
];

const rolePlan = {
  super_admin: 1,
  school_admin: 2,
  teacher: 18,
  hr_staff: 4,
  finance_officer: 4,
  librarian: 3,
  it_support: 3,
  parent: 55,
  student: 110,
};

const cleanupRunArg =
  process.argv.find((argument) => argument.startsWith("--cleanup-run="))?.split("=")[1] || process.env.BETA_CLEANUP_RUN_ID;

if (cleanupRunArg) {
  await cleanupRun(cleanupRunArg);
  process.exit(0);
}

const classPlan = [
  { name: "Nursery 1", level: "Nursery 1", capacity: 35, subjects: ["Literacy", "Numeracy", "Creative Arts"] },
  { name: "Nursery 2", level: "Nursery 2", capacity: 35, subjects: ["Literacy", "Numeracy", "Creative Arts"] },
  { name: "KG 1", level: "Kindergarten 1", capacity: 35, subjects: ["Literacy", "Numeracy", "Creative Arts", "OWOP", "Writing"] },
  { name: "KG 2", level: "Kindergarten 2", capacity: 35, subjects: ["Literacy", "Numeracy", "Creative Arts", "OWOP", "Writing"] },
  { name: "Primary 1", level: "Primary 1", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
  { name: "Primary 2", level: "Primary 2", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
  { name: "Primary 3", level: "Primary 3", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
  { name: "Primary 4", level: "Primary 4", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
  { name: "Primary 5", level: "Primary 5", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
  { name: "Primary 6", level: "Primary 6", capacity: 35, subjects: ["Maths", "English", "RME", "Creative Art", "Digital Literacy", "Ghanaian Language", "French", "History"] },
];

const firstNames = [
  "Ama",
  "Kofi",
  "Akosua",
  "Kwame",
  "Esi",
  "Yaw",
  "Abena",
  "Kojo",
  "Afia",
  "Kwesi",
  "Nana",
  "Adjoa",
  "Selasi",
  "Maame",
  "Fiifi",
  "Efua",
  "Sena",
  "Yaa",
  "Kweku",
  "Aba",
];

const lastNames = [
  "Mensah",
  "Boateng",
  "Owusu",
  "Agyeman",
  "Asante",
  "Osei",
  "Darko",
  "Appiah",
  "Tetteh",
  "Amoah",
  "Sarpong",
  "Annan",
  "Addo",
  "Frimpong",
  "Baah",
  "Nyarko",
  "Dapaah",
  "Opoku",
  "Acheampong",
  "Bonsu",
];

function makePeople() {
  const people = [];
  for (const [role, count] of Object.entries(rolePlan)) {
    for (let index = 1; index <= count; index += 1) {
      const firstName = firstNames[(people.length + index) % firstNames.length];
      const lastName = lastNames[(people.length + index * 3) % lastNames.length];
      const label = `${role.replace(/_/g, "-")}-${String(index).padStart(3, "0")}`;
      people.push({
        role,
        firstName,
        lastName,
        email: `cis-beta-${runId}-${label}@example.com`,
        password: `CrestviewBeta!${runId.slice(-6)}-${String(index).padStart(3, "0")}`,
        phone: `+233550${String(100000 + people.length).slice(-6)}`,
      });
    }
  }
  return people;
}

const roleIds = await step("ensure roles", async () => {
  const rows = rolesToCreate.map(([name, display_name, description]) => ({ name, display_name, description, deleted_at: null }));
  const roles = await dbUpsert("roles", rows, { onConflict: "name" });
  return Object.fromEntries(roles.map((role) => [role.name, role.id]));
});

const { academicYear, terms } = await step("create beta academic calendar", async () => {
  const [year] = await dbUpsert(
    "academic_years",
    [
      {
        name: `Crestview Beta ${runId}`,
        start_date: "2026-09-01",
        end_date: "2027-07-31",
        is_current: false,
        deleted_at: null,
      },
    ],
    { onConflict: "name" },
  );
  const createdTerms = await dbUpsert(
    "terms",
    [
      { academic_year_id: year.id, name: "Term 1", starts_on: "2026-09-01", ends_on: "2026-12-18", is_current: true },
      { academic_year_id: year.id, name: "Term 2", starts_on: "2027-01-12", ends_on: "2027-04-09", is_current: false },
      { academic_year_id: year.id, name: "Term 3", starts_on: "2027-05-04", ends_on: "2027-07-31", is_current: false },
    ],
    { onConflict: "academic_year_id,name" },
  );
  await dbUpsert(
    "school_days",
    Array.from({ length: 5 }, (_, index) => ({
      academic_year_id: year.id,
      term_id: createdTerms.find((term) => term.name === "Term 1")?.id,
      school_date: plusDays(index),
      day_type: "instructional",
      title: `Beta instructional day ${index + 1}`,
      notes: `Synthetic attendance day for beta run ${runId}`,
    })),
    { onConflict: "school_date" },
  );
  return { academicYear: year, terms: createdTerms };
});

const { departments, subjects, classrooms } = await step("create school structure", async () => {
  const departmentRows = [
    ["ADM", "Administration"],
    ["ACA", "Academics"],
    ["FIN", "Finance"],
    ["HR", "Human Resource"],
    ["LIB", "Library"],
    ["IT", "Information Technology"],
  ].map(([code, name]) => ({ code, name, description: `${name} beta department` }));
  const createdDepartments = await dbUpsert("departments", departmentRows, { onConflict: "code" });
  const academicDepartment = createdDepartments.find((department) => department.code === "ACA");
  const subjectNames = [...new Set(classPlan.flatMap((item) => item.subjects))];
  const createdSubjects = await dbUpsert(
    "subjects",
    subjectNames.map((name) => ({
      name,
      code: `CIS-${stableCode(name)}`,
      department_id: academicDepartment?.id,
      credit_hours: 1,
      deleted_at: null,
    })),
    { onConflict: "code" },
  );
  const createdClassrooms = await dbUpsert(
    "classrooms",
    classPlan.map((item, index) => ({
      name: `${item.name} Beta ${runId}`,
      grade_level: item.level,
      academic_year_id: academicYear.id,
      capacity: item.capacity,
      room_number: `B-${String(index + 1).padStart(2, "0")}`,
      deleted_at: null,
    })),
    { onConflict: "name,academic_year_id" },
  );
  return { departments: createdDepartments, subjects: createdSubjects, classrooms: createdClassrooms };
});

const people = await step("create 200 auth users and profiles", async () => {
  const planned = makePeople();
  for (let index = 0; index < planned.length; index += 1) {
    const person = planned[index];
    const { data, error } = await supabase.auth.admin.createUser({
      email: person.email,
      password: person.password,
      email_confirm: true,
      user_metadata: {
        first_name: person.firstName,
        last_name: person.lastName,
        role: person.role,
        ...betaMarker,
      },
      app_metadata: { role: person.role, ...betaMarker },
    });
    if (error) throw new Error(`auth create failed for ${person.email}: ${error.message}`);
    person.id = data.user.id;
    if (["super_admin", "school_admin", "teacher", "student", "parent", "finance_officer", "hr_staff", "librarian", "it_support"].includes(person.role)) {
      report.sampleCredentials.push({ role: person.role, email: person.email, password: person.password });
    }
    if ((index + 1) % 25 === 0) process.stdout.write(` ${index + 1}`);
  }
  await dbInsert(
    "profiles",
    planned.map((person) => ({
      id: person.id,
      role_id: roleIds[person.role],
      first_name: person.firstName,
      last_name: person.lastName,
      email: person.email,
      phone: person.phone,
      nationality: "Ghana",
      is_active: true,
      onboarding_completed_at: new Date().toISOString(),
      metadata: betaMarker,
    })),
  );
  return planned;
});

const peopleByRole = Object.groupBy(people, (person) => person.role);

const staffProfiles = await step("create staff records and class assignments", async () => {
  const staffPeople = people.filter((person) => !["student", "parent"].includes(person.role));
  const staffRows = staffPeople.map((person, index) => ({
    profile_id: person.id,
    staff_number: `CIS-BETA-${runId}-${String(index + 1).padStart(3, "0")}`,
    department_id:
      departments.find((department) =>
        person.role === "finance_officer"
          ? department.code === "FIN"
          : person.role === "hr_staff"
            ? department.code === "HR"
            : person.role === "librarian"
              ? department.code === "LIB"
              : person.role === "it_support"
                ? department.code === "IT"
                : person.role === "teacher"
                  ? department.code === "ACA"
                  : department.code === "ADM",
      )?.id ?? null,
    job_title: person.role.replace(/_/g, " "),
    employment_type: "full_time",
    hire_date: "2026-06-13",
    qualification_summary: "Synthetic beta staff account for full-platform readiness testing.",
    metadata: betaMarker,
  }));
  const createdStaff = await dbInsert("staff_profiles", staffRows);
  const teachers = peopleByRole.teacher ?? [];
  await dbUpsert(
    "staff_class_assignments",
    classrooms.map((classroom, index) => ({
      profile_id: teachers[index % teachers.length].id,
      classroom_id: classroom.id,
      academic_year_id: academicYear.id,
      assignment_type: "class_teacher",
      status: "active",
      assigned_by: peopleByRole.super_admin[0].id,
      starts_on: "2026-09-01",
      metadata: { ...betaMarker, class_name: classroom.name },
    })),
    { onConflict: "profile_id,classroom_id,academic_year_id,assignment_type" },
  );
  return createdStaff;
});

const courses = await step("create courses and teacher assignments", async () => {
  const subjectByName = Object.fromEntries(subjects.map((subject) => [subject.name, subject]));
  const classroomByBaseName = Object.fromEntries(classrooms.map((classroom) => [classroom.name.replace(` Beta ${runId}`, ""), classroom]));
  const teachers = peopleByRole.teacher ?? [];
  const courseRows = [];
  for (const [classIndex, classItem] of classPlan.entries()) {
    const classroom = classroomByBaseName[classItem.name];
    for (const [subjectIndex, subjectName] of classItem.subjects.entries()) {
      courseRows.push({
        subject_id: subjectByName[subjectName].id,
        classroom_id: classroom.id,
        teacher_id: teachers[(classIndex + subjectIndex) % teachers.length].id,
        academic_year_id: academicYear.id,
        term: "Term 1",
        deleted_at: null,
      });
    }
  }
  const createdCourses = await dbUpsert("courses", courseRows, { onConflict: "subject_id,classroom_id,academic_year_id,term" });
  await dbUpsert(
    "teacher_assignments",
    createdCourses.map((course) => ({ teacher_id: course.teacher_id, course_id: course.id, role: "lead", deleted_at: null })),
    { onConflict: "teacher_id,course_id" },
  );
  await dbUpsert(
    "staff_class_assignments",
    createdCourses.map((course) => ({
      profile_id: course.teacher_id,
      classroom_id: course.classroom_id,
      academic_year_id: academicYear.id,
      assignment_type: "subject_teacher",
      status: "active",
      assigned_by: peopleByRole.super_admin[0].id,
      starts_on: "2026-09-01",
      metadata: { ...betaMarker, course_id: course.id },
    })),
    { onConflict: "profile_id,classroom_id,academic_year_id,assignment_type" },
  );
  return createdCourses;
});

const { students, parentLinks } = await step("enroll 110 students and link 55 parents", async () => {
  const studentPeople = peopleByRole.student ?? [];
  const parentPeople = peopleByRole.parent ?? [];
  const studentsByPerson = await dbInsert(
    "students",
    studentPeople.map((person, index) => {
      const classroom = classrooms[index % classrooms.length];
      return {
        profile_id: person.id,
        student_number: `CIS-${runId}-${String(index + 1).padStart(3, "0")}`,
        classroom_id: classroom.id,
        enrollment_date: "2026-09-01",
        status: "active",
        house: ["Red", "Blue", "Yellow", "Green"][index % 4],
        boarding_status: "day",
        metadata: { ...betaMarker, classroom_name: classroom.name },
      };
    }),
  );
  const links = await dbUpsert(
    "parent_students",
    studentsByPerson.map((student, index) => ({
      parent_profile_id: parentPeople[index % parentPeople.length].id,
      student_id: student.id,
      relationship: index % 3 === 0 ? "mother" : index % 3 === 1 ? "father" : "guardian",
      deleted_at: null,
    })),
    { onConflict: "parent_profile_id,student_id" },
  );
  await dbInsert(
    "student_enrollments",
    studentsByPerson.map((student) => ({
      student_id: student.id,
      classroom_id: student.classroom_id,
      academic_year_id: academicYear.id,
      enrolled_on: "2026-09-01",
      status: "active",
      notes: `Beta enrollment generated for run ${runId}`,
    })),
  );
  await dbInsert(
    "student_medical_records",
    studentsByPerson.slice(0, 40).map((student, index) => ({
      student_id: student.id,
      blood_type: ["O+", "A+", "B+", "AB+"][index % 4],
      allergies: index % 7 === 0 ? "Peanuts" : null,
      medical_conditions: index % 9 === 0 ? "Asthma" : null,
      physician_name: "Crestview Beta Clinic",
      physician_phone: "+233245131619",
      notes: "Synthetic health record for beta testing.",
    })),
  );
  await dbInsert(
    "class_roster_snapshots",
    classrooms.map((classroom) => {
      const roster = studentsByPerson
        .filter((student) => student.classroom_id === classroom.id)
        .map((student) => {
          const profile = studentPeople.find((person) => person.id === student.profile_id);
          return {
            student_id: student.id,
            student_number: student.student_number,
            name: `${profile.firstName} ${profile.lastName}`,
          };
        });
      return {
        classroom_id: classroom.id,
        academic_year_id: academicYear.id,
        term_id: terms.find((term) => term.name === "Term 1")?.id,
        captured_by: peopleByRole.super_admin[0].id,
        snapshot_type: "manual",
        student_count: roster.length,
        roster,
        notes: `Teacher-ready roster snapshot for beta run ${runId}`,
      };
    }),
  );
  return { students: studentsByPerson, parentLinks: links };
});

const applications = await step("simulate admissions and recruitment", async () => {
  const parentPeople = peopleByRole.parent ?? [];
  const admissionRows = Array.from({ length: 24 }, (_, index) => {
    const linkedStudent = students[index % students.length];
    const parentProfile = parentPeople[index % parentPeople.length];
    const accepted = index < 12;
    const rejected = index >= 12 && index < 18;
    return {
      applicant_first_name: firstNames[index % firstNames.length],
      applicant_last_name: lastNames[index % lastNames.length],
      applying_grade: classPlan[index % classPlan.length].name,
      guardian_email: parentProfile.email,
      guardian_phone: parentProfile.phone,
      status: accepted ? "accepted" : rejected ? "rejected" : index % 2 === 0 ? "reviewing" : "submitted",
      notes: accepted ? "Accepted during full beta admissions workflow." : "Pending or rejected beta admission workflow.",
      accepted_student_id: accepted ? linkedStudent.id : null,
      parent_profile_id: accepted ? parentProfile.id : null,
      generated_student_number: accepted ? linkedStudent.student_number : null,
      onboarding_notes: accepted ? `Parent account ready. Temporary password pattern validated for beta run ${runId}.` : null,
      metadata: { ...betaMarker, admission_batch: "full-platform" },
    };
  });
  const admissions = await dbInsert("admission_applications", admissionRows);
  const postings = await dbInsert(
    "job_postings",
    ["STEM and Robotics Teacher", "Music Teacher", "Lower Primary Teacher", "School Nurse"].map((title, index) => ({
      title: `${title} Beta ${runId}`,
      department_id: departments.find((department) => (index === 3 ? department.code === "ADM" : department.code === "ACA"))?.id ?? null,
      employment_type: index === 3 ? "part_time" : "full_time",
      description: `${title} recruitment workflow generated for beta readiness testing.`,
      closes_on: plusDays(30 + index),
      is_active: true,
    })),
  );
  const jobApps = await dbInsert(
    "job_applications",
    Array.from({ length: 18 }, (_, index) => ({
      job_posting_id: postings[index % postings.length].id,
      first_name: firstNames[(index + 5) % firstNames.length],
      last_name: lastNames[(index + 9) % lastNames.length],
      email: `cis-beta-${runId}-candidate-${String(index + 1).padStart(3, "0")}@example.com`,
      phone: `+233244${String(200000 + index).slice(-6)}`,
      cover_letter: "I am applying through the public recruitment flow for a beta readiness test.",
      status: index < 5 ? "hired" : index < 8 ? "rejected" : index < 12 ? "interview" : "submitted",
      assigned_to: (peopleByRole.hr_staff ?? [])[index % peopleByRole.hr_staff.length]?.id ?? null,
      metadata: { ...betaMarker, candidate_index: index + 1 },
    })),
  );
  await dbInsert(
    "job_application_status_history",
    jobApps.map((application) => ({
      job_application_id: application.id,
      from_status: null,
      to_status: application.status,
      changed_by: peopleByRole.super_admin[0].id,
      reason: "Beta recruitment decision simulation.",
    })),
  );
  return { admissions, jobApps, postings };
});

const finance = await step("simulate class billing, invoices, and payments", async () => {
  const batches = await dbInsert(
    "billing_batches",
    classrooms.map((classroom, index) => ({
      batch_number: `BILL-${runId}-${String(index + 1).padStart(2, "0")}`,
      classroom_id: classroom.id,
      title: `${classroom.grade_level} Term 1 Fees`,
      description: "Class-level automated fee billing generated during beta readiness testing.",
      amount: index < 2 ? 1500 : index < 4 ? 1800 : 2200 + index * 150,
      currency: "GHS",
      due_date: plusDays(35),
      status: "open",
      created_by: peopleByRole.finance_officer[0].id,
      issued_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      metadata: betaMarker,
    })),
  );
  const batchByClass = Object.fromEntries(batches.map((batch) => [batch.classroom_id, batch]));
  const invoices = await dbInsert(
    "invoices",
    students.map((student, index) => {
      const batch = batchByClass[student.classroom_id];
      const status = index % 5 === 0 ? "paid" : index % 7 === 0 ? "overdue" : "open";
      return {
        student_id: student.id,
        invoice_number: `INV-${runId}-${String(index + 1).padStart(4, "0")}`,
        amount: batch.amount,
        currency: "GHS",
        status,
        due_date: plusDays(status === "overdue" ? -2 : 35),
        title: batch.title,
        description: "Automated class fee invoice.",
        classroom_id: student.classroom_id,
        issued_by: peopleByRole.finance_officer[0].id,
        sent_at: new Date().toISOString(),
        billing_batch_id: batch.id,
        metadata: betaMarker,
      };
    }),
  );
  await dbInsert(
    "invoice_items",
    invoices.flatMap((invoice) => [
      {
        invoice_id: invoice.id,
        description: "Tuition and curriculum resources",
        quantity: 1,
        unit_amount: Number(invoice.amount) * 0.85,
      },
      {
        invoice_id: invoice.id,
        description: "STEM, robotics, music, and digital learning support",
        quantity: 1,
        unit_amount: Number(invoice.amount) * 0.15,
      },
    ]),
  );
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const payments = await dbInsert(
    "payments",
    paidInvoices.map((invoice, index) => ({
      invoice_id: invoice.id,
      provider: "beta-cash-office",
      provider_reference: `PAY-${runId}-${String(index + 1).padStart(4, "0")}`,
      amount: invoice.amount,
      status: "verified",
      paid_at: new Date().toISOString(),
      metadata: betaMarker,
    })),
  );
  return { batches, invoices, payments };
});

const attendance = await step("submit teacher attendance registers", async () => {
  const teachers = peopleByRole.teacher ?? [];
  const registers = [];
  const records = [];
  for (let day = 0; day < 5; day += 1) {
    for (const [classIndex, classroom] of classrooms.entries()) {
      const classStudents = students.filter((student) => student.classroom_id === classroom.id);
      const classroomCourses = courses.filter((course) => course.classroom_id === classroom.id);
      const course = classroomCourses[0];
      const teacherId = course?.teacher_id ?? teachers[classIndex % teachers.length].id;
      const counts = { present: 0, late: 0, absent: 0, excused: 0 };
      classStudents.forEach((student, index) => {
        const status = (index + day) % 17 === 0 ? "absent" : (index + day) % 13 === 0 ? "late" : (index + day) % 19 === 0 ? "excused" : "present";
        counts[status] += 1;
      });
      registers.push({
        classroom_id: classroom.id,
        academic_year_id: academicYear.id,
        term_id: terms.find((term) => term.name === "Term 1")?.id,
        attendance_date: plusDays(day),
        status: "submitted",
        submitted_by: teacherId,
        submitted_at: isoPlusDays(day, 16),
        counts,
        notes: `Daily register submitted in beta run ${runId}.`,
        metadata: betaMarker,
      });
    }
  }
  const createdRegisters = await dbInsert("attendance_registers", registers);
  for (const register of createdRegisters) {
    const classStudents = students.filter((student) => student.classroom_id === register.classroom_id);
    const course = courses.find((item) => item.classroom_id === register.classroom_id);
    classStudents.forEach((student, index) => {
      const day = Number(register.attendance_date.slice(-2));
      const status = (index + day) % 17 === 0 ? "absent" : (index + day) % 13 === 0 ? "late" : (index + day) % 19 === 0 ? "excused" : "present";
      records.push({
        student_id: student.id,
        classroom_id: register.classroom_id,
        course_id: course?.id ?? null,
        attendance_date: register.attendance_date,
        status,
        recorded_by: register.submitted_by,
        notes: status === "present" ? null : `Beta ${status} follow-up required.`,
        register_id: register.id,
      });
    });
  }
  const createdRecords = await dbInsert("attendance_records", records);
  return { registers: createdRegisters, records: createdRecords };
});

const gradebook = await step("publish class-specific 30/70 grading", async () => {
  const scaleRows = await dbSelect("grading_scales");
  const scaleByCode = Object.fromEntries(scaleRows.map((scale) => [scale.code, scale]));
  const gradeItems = await dbInsert(
    "grade_items",
    courses.map((course) => {
      const subject = subjects.find((item) => item.id === course.subject_id);
      const classroom = classrooms.find((item) => item.id === course.classroom_id);
      return {
        course_id: course.id,
        title: `${subject?.name ?? "Subject"} End of Term Grading Report`,
        category: "term_report",
        max_score: 100,
        weight: 1,
        published_at: new Date().toISOString(),
        due_date: "2026-12-12",
        status: "published",
        metadata: {
          ...betaMarker,
          school: "Crestview International School",
          report_title: "End of Term Grading Report",
          classroom: classroom?.grade_level,
          template: "crestview_30_70_professional",
          components: { assignment_10: 10, quiz_10: 10, midterm_10: 10, class_assessment_30: 30, end_term_exam_70: 70, total_100: 100 },
        },
      };
    }),
  );
  const itemByCourse = Object.fromEntries(gradeItems.map((item) => [item.course_id, item]));
  const gradeRows = [];
  for (const course of courses) {
    const subject = subjects.find((item) => item.id === course.subject_id);
    const classStudents = students.filter((student) => student.classroom_id === course.classroom_id);
    for (const [index, student] of classStudents.entries()) {
      const assignment = Math.min(10, 5 + ((index + subject.name.length) % 6));
      const quiz = Math.min(10, 4 + ((index * 2 + subject.name.length) % 7));
      const midterm = Math.min(10, 4 + ((index * 3 + subject.name.length) % 7));
      const classAssessment = assignment + quiz + midterm;
      const exam = Math.min(70, 32 + ((index * 7 + subject.name.length * 3) % 39));
      const total = classAssessment + exam;
      const grade = gradeFor(total);
      gradeRows.push({
        grade_item_id: itemByCourse[course.id].id,
        student_id: student.id,
        score: total,
        comments: `${grade.remark}. Beta-generated teacher comment for ${subject.name}.`,
        graded_by: course.teacher_id,
        percentage: total,
        grade_code: grade.code,
        grade_points: grade.points,
        remark: grade.remark,
        scale_id: scaleByCode[grade.code]?.id ?? null,
        assignment_score: assignment,
        quiz_score: quiz,
        midterm_score: midterm,
        class_assessment_score: classAssessment,
        exam_score: exam,
        total_score: total,
        subject_name: subject.name,
        term_label: "Term 1",
        analysis: {
          ...betaMarker,
          strengths: total >= 70 ? ["Strong subject mastery", "Consistent class assessment performance"] : ["Participates in class"],
          concerns: total < 50 ? ["Needs additional remediation", "Weak end-of-term exam score"] : [],
          recommendation: total < 50 ? "Schedule teacher-parent intervention and targeted practice." : "Continue enrichment and revision routine.",
        },
      });
    }
  }
  const grades = await dbInsert("grades", gradeRows);
  await dbInsert(
    "grade_import_batches",
    gradeItems.slice(0, 20).map((item, index) => {
      const course = courses.find((courseRow) => courseRow.id === item.course_id);
      const subject = subjects.find((subjectRow) => subjectRow.id === course.subject_id);
      return {
        course_id: item.course_id,
        grade_item_id: item.id,
        uploaded_by: course.teacher_id,
        file_name: `crestview-professional-grade-template-${runId}-${String(index + 1).padStart(2, "0")}.xlsx`,
        status: "processed",
        rows_total: students.filter((student) => student.classroom_id === course.classroom_id).length,
        rows_success: students.filter((student) => student.classroom_id === course.classroom_id).length,
        rows_failed: 0,
        classroom_id: course.classroom_id,
        academic_year_id: academicYear.id,
        subject_id: subject.id,
        term: "Term 1",
        metadata: { ...betaMarker, template_quality: "professional_30_70" },
      };
    }),
  );
  return { gradeItems, grades };
});

const reportsAndAnalytics = await step("generate reports, student 360 notes, and academic analytics", async () => {
  const gradesByStudent = Map.groupBy(gradebook.grades, (grade) => grade.student_id);
  const attendanceByStudent = Map.groupBy(attendance.records, (record) => record.student_id);
  const reports = await dbInsert(
    "reports",
    students.map((student, index) => {
      const studentGrades = gradesByStudent.get(student.id) ?? [];
      const studentAttendance = attendanceByStudent.get(student.id) ?? [];
      const average =
        studentGrades.length > 0 ? Math.round((studentGrades.reduce((sum, grade) => sum + Number(grade.total_score ?? grade.score), 0) / studentGrades.length) * 10) / 10 : 0;
      const present = studentAttendance.filter((record) => record.status === "present").length;
      const attendanceRate = studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 1000) / 10 : 0;
      return {
        student_id: student.id,
        academic_year_id: academicYear.id,
        term: "Term 1",
        summary: `End of Term Report generated from ${studentGrades.length} subject records and ${studentAttendance.length} attendance entries.`,
        report_url: null,
        generated_by: peopleByRole.teacher[index % peopleByRole.teacher.length].id,
        status: "published",
        published_at: new Date().toISOString(),
        analysis: {
          ...betaMarker,
          average,
          attendanceRate,
          strengths: average >= 70 ? ["Academic consistency", "Strong engagement"] : ["Shows willingness to improve"],
          weaknesses: average < 50 ? ["Needs more practice in core subjects"] : [],
          recommendations: average < 50 ? ["Weekly remedial plan", "Parent-teacher conference"] : ["Maintain revision plan", "Stretch enrichment tasks"],
        },
        attendance_summary: { rate: attendanceRate, present, total: studentAttendance.length },
        grade_summary: { average, subjects: studentGrades.length },
        attitude: index % 9 === 0 ? "Needs reminders to stay focused" : "Positive and cooperative",
        punctuality: attendanceRate >= 90 ? "Very punctual" : "Needs punctuality support",
        next_steps: average < 50 ? "Academic support task opened for teacher follow-up." : "Continue current learning plan.",
        classroom_id: student.classroom_id,
        metadata: betaMarker,
      };
    }),
  );
  await dbInsert(
    "ai_analytics",
    students.map((student) => {
      const studentGrades = gradesByStudent.get(student.id) ?? [];
      const average = studentGrades.length > 0 ? studentGrades.reduce((sum, grade) => sum + Number(grade.total_score ?? grade.score), 0) / studentGrades.length : 0;
      return {
        student_id: student.id,
        academic_year_id: academicYear.id,
        term: "Term 1",
        risk_level: average < 50 ? "red" : average < 60 ? "amber" : "green",
        strengths: average >= 70 ? ["Strong academic performance"] : ["Participates in learning activities"],
        concerns: average < 50 ? ["Low average score"] : [],
        recommendations: average < 50 ? ["Remedial intervention", "Guardian engagement"] : ["Maintain steady monitoring"],
      };
    }),
  );
  await dbInsert(
    "student_360_notes",
    students.slice(0, 60).map((student, index) => ({
      student_id: student.id,
      note_type: index % 3 === 0 ? "academic" : index % 3 === 1 ? "attendance" : "finance",
      title: `Beta student 360 follow-up ${index + 1}`,
      body: "Synthetic operational note showing how staff can track learner support across academics, attendance, and finance.",
      visibility: index % 5 === 0 ? "guardian" : "staff",
      created_by: peopleByRole.teacher[index % peopleByRole.teacher.length].id,
      metadata: betaMarker,
    })),
  );
  return { reports };
});

const operations = await step("exercise HR, library, IT, events, communication, and automation", async () => {
  const payrollPeriod = await dbInsert("payroll_periods", {
    name: `June 2026 Beta Payroll ${runId}`,
    starts_on: "2026-06-01",
    ends_on: "2026-06-30",
    status: "closed",
  });
  await dbInsert(
    "payroll_items",
    staffProfiles.map((staff, index) => ({
      payroll_period_id: payrollPeriod[0].id,
      staff_profile_id: staff.profile_id,
      gross_pay: 1800 + (index % 8) * 250,
      deductions: 100 + (index % 4) * 25,
    })),
  );
  await dbInsert(
    "staff_attendance_records",
    staffProfiles.flatMap((staff, staffIndex) =>
      Array.from({ length: 5 }, (_, day) => ({
        staff_profile_id: staff.id,
        attendance_date: plusDays(day),
        status: (staffIndex + day) % 19 === 0 ? "leave" : (staffIndex + day) % 13 === 0 ? "late" : "present",
        clock_in_at: isoPlusDays(day, 7),
        clock_out_at: isoPlusDays(day, 16),
        recorded_by: peopleByRole.hr_staff[0].id,
        notes: `Beta staff attendance ${runId}`,
      })),
    ),
  );
  await dbInsert(
    "leave_requests",
    staffProfiles.slice(0, 12).map((staff, index) => ({
      staff_profile_id: staff.id,
      leave_type: index % 3 === 0 ? "medical" : "annual",
      starts_on: plusDays(14 + index),
      ends_on: plusDays(15 + index),
      reason: "Synthetic HR leave workflow test.",
      status: index % 4 === 0 ? "approved" : index % 5 === 0 ? "rejected" : "pending",
      reviewed_by: index % 4 === 0 || index % 5 === 0 ? peopleByRole.hr_staff[0].id : null,
      reviewed_at: index % 4 === 0 || index % 5 === 0 ? new Date().toISOString() : null,
    })),
  );
  const books = await dbInsert(
    "library_books",
    Array.from({ length: 12 }, (_, index) => ({
      isbn: `BETA-${runId}-${String(index + 1).padStart(2, "0")}`,
      title: ["Cambridge Primary Science", "Robotics for Young Learners", "Music Theory Foundations", "Ghanaian Language Reader"][index % 4] + ` ${index + 1}`,
      authors: ["Crestview Beta Library"],
      publisher: "Crestview",
      published_year: 2026,
      category: ["STEM", "Robotics", "Music", "Literacy"][index % 4],
      description: "Synthetic library resource for beta circulation testing.",
    })),
  );
  const copies = await dbInsert(
    "library_copies",
    books.flatMap((book, bookIndex) =>
      Array.from({ length: 3 }, (_, copyIndex) => ({
        book_id: book.id,
        barcode: `LIB-${runId}-${String(bookIndex + 1).padStart(2, "0")}-${copyIndex + 1}`,
        shelf_location: `B${bookIndex + 1}`,
        status: copyIndex === 0 ? "loaned" : "available",
        acquired_on: "2026-06-13",
      })),
    ),
  );
  await dbInsert(
    "library_loans",
    copies.slice(0, 30).map((copy, index) => ({
      copy_id: copy.id,
      borrower_profile_id: people[index % people.length].id,
      loaned_at: isoPlusDays(-index, 11),
      due_at: isoPlusDays(14 + index, 11),
      returned_at: index % 5 === 0 ? isoPlusDays(2, 11) : null,
      issued_by: peopleByRole.librarian[index % peopleByRole.librarian.length].id,
      received_by: index % 5 === 0 ? peopleByRole.librarian[0].id : null,
    })),
  );
  const devices = await dbInsert(
    "devices",
    Array.from({ length: 30 }, (_, index) => ({
      asset_tag: `IT-${runId}-${String(index + 1).padStart(3, "0")}`,
      name: ["Teacher Laptop", "Robotics Tablet", "Library Workstation", "Music Lab Keyboard"][index % 4] + ` ${index + 1}`,
      device_type: ["laptop", "tablet", "desktop", "music_equipment"][index % 4],
      serial_number: `SN-${runId}-${index + 1}`,
      assigned_to: people[index % people.length].id,
      location: classrooms[index % classrooms.length].room_number,
      status: index % 9 === 0 ? "repair" : "active",
      purchased_on: "2026-06-01",
      metadata: betaMarker,
    })),
  );
  const tickets = await dbInsert(
    "support_tickets",
    Array.from({ length: 30 }, (_, index) => ({
      ticket_number: `TCK-${runId}-${String(index + 1).padStart(3, "0")}`,
      requester_id: people[index % people.length].id,
      assigned_to: peopleByRole.it_support[index % peopleByRole.it_support.length].id,
      title: `Beta IT support ticket ${index + 1}`,
      description: "Synthetic ticket exercising IT help desk workflow.",
      status: index % 6 === 0 ? "resolved" : index % 4 === 0 ? "in_progress" : "open",
      priority: index % 9 === 0 ? "urgent" : index % 5 === 0 ? "high" : "normal",
      category: ["device", "network", "portal", "classroom"][index % 4],
      resolved_at: index % 6 === 0 ? new Date().toISOString() : null,
      metadata: { ...betaMarker, device_id: devices[index % devices.length].id },
    })),
  );
  await dbInsert(
    "support_ticket_comments",
    tickets.map((ticket, index) => ({
      ticket_id: ticket.id,
      author_id: peopleByRole.it_support[index % peopleByRole.it_support.length].id,
      body: "Beta support note added by IT.",
      is_internal: index % 2 === 0,
    })),
  );
  await dbInsert(
    "events",
    ["Admissions interview day", "STEM and Robotics Showcase", "Music and Creative Arts Open Day", "Parent finance briefing"].map((title, index) => ({
      slug: `beta-${runId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      description: `Event generated during beta run ${runId}.`,
      location: "Crestview International School",
      starts_at: isoPlusDays(5 + index * 4, 10),
      ends_at: isoPlusDays(5 + index * 4, 12),
      status: "scheduled",
      audience: index === 0 ? ["parents", "admin"] : ["public", "students", "parents"],
      created_by: peopleByRole.school_admin[0].id,
      metadata: betaMarker,
    })),
  );
  const campaign = await dbInsert("communication_campaigns", {
    name: `Beta readiness broadcast ${runId}`,
    subject: "Crestview beta readiness notification",
    body: "This message confirms role-specific notifications can be delivered across the platform.",
    channel: "in_app",
    audience_type: "all",
    audience_roles: [],
    status: "sent",
    sent_at: new Date().toISOString(),
    created_by: peopleByRole.school_admin[0].id,
    metadata: betaMarker,
  });
  await dbInsert(
    "communication_recipients",
    people.map((person) => ({
      campaign_id: campaign[0].id,
      profile_id: person.id,
      recipient_email: person.email,
      recipient_phone: person.phone,
      status: person.role === "student" ? "queued" : "sent",
      sent_at: person.role === "student" ? null : new Date().toISOString(),
      metadata: betaMarker,
    })),
  );
  return { payrollPeriod, books, copies, tickets, devices };
});

await step("create notifications, messages, tasks, and lifecycle records", async () => {
  const invoiceByStudent = Map.groupBy(finance.invoices, (invoice) => invoice.student_id);
  const parentByStudent = Object.fromEntries(parentLinks.map((link) => [link.student_id, link.parent_profile_id]));
  await dbInsert(
    "notifications",
    people.map((person) => ({
      recipient_id: person.id,
      title: `Beta role notification for ${person.role.replace(/_/g, " ")}`,
      body: "This synthetic message verifies role-specific in-app notification delivery.",
      type: person.role === "parent" ? "finance" : person.role === "teacher" ? "academics" : "system",
      metadata: betaMarker,
    })),
  );
  await dbInsert(
    "notifications",
    students.flatMap((student) => {
      const parentId = parentByStudent[student.id];
      const invoices = invoiceByStudent.get(student.id) ?? [];
      return invoices.map((invoice) => ({
        recipient_id: parentId,
        title: `Invoice ${invoice.invoice_number} issued`,
        body: `A ${invoice.currency} ${invoice.amount} invoice has been issued for your ward.`,
        type: "finance",
        metadata: { ...betaMarker, invoice_id: invoice.id, student_id: student.id },
      }));
    }),
  );
  const conversations = await dbInsert(
    "conversations",
    Array.from({ length: 20 }, (_, index) => ({
      title: `Beta parent-teacher conversation ${index + 1}`,
      created_by: peopleByRole.teacher[index % peopleByRole.teacher.length].id,
    })),
  );
  await dbInsert(
    "conversation_members",
    conversations.flatMap((conversation, index) => {
      const student = students[index % students.length];
      return [
        { conversation_id: conversation.id, profile_id: peopleByRole.teacher[index % peopleByRole.teacher.length].id },
        { conversation_id: conversation.id, profile_id: parentByStudent[student.id] },
        { conversation_id: conversation.id, profile_id: student.profile_id },
      ];
    }),
  );
  await dbInsert(
    "messages",
    conversations.flatMap((conversation, index) => [
      {
        conversation_id: conversation.id,
        sender_id: peopleByRole.teacher[index % peopleByRole.teacher.length].id,
        body: "Teacher update generated during beta testing.",
      },
      {
        conversation_id: conversation.id,
        sender_id: peopleByRole.parent[index % peopleByRole.parent.length].id,
        body: "Guardian acknowledgement generated during beta testing.",
      },
    ]),
  );
  await dbInsert(
    "workflow_tasks",
    [
      ...applications.admissions.slice(0, 10).map((application, index) => ({
        task_number: `TASK-${runId}-ADM-${String(index + 1).padStart(3, "0")}`,
        title: `Admission follow-up: ${application.applicant_first_name} ${application.applicant_last_name}`,
        description: "Review admission documents and onboarding status.",
        workflow_key: "admissions.review",
        status: index % 3 === 0 ? "completed" : "open",
        priority: index % 4 === 0 ? "high" : "normal",
        assigned_to: peopleByRole.school_admin[index % peopleByRole.school_admin.length].id,
        created_by: peopleByRole.super_admin[0].id,
        student_id: application.accepted_student_id,
        parent_profile_id: application.parent_profile_id,
        classroom_id: students.find((student) => student.id === application.accepted_student_id)?.classroom_id ?? null,
        related_table: "admission_applications",
        related_record_id: application.id,
        completed_at: index % 3 === 0 ? new Date().toISOString() : null,
        metadata: betaMarker,
      })),
      ...finance.invoices
        .filter((invoice) => invoice.status !== "paid")
        .slice(0, 25)
        .map((invoice, index) => ({
          task_number: `TASK-${runId}-FIN-${String(index + 1).padStart(3, "0")}`,
          title: `Fee follow-up: ${invoice.invoice_number}`,
          description: "Contact guardian about pending or overdue fees.",
          workflow_key: "finance.invoice_followup",
          status: "open",
          priority: invoice.status === "overdue" ? "urgent" : "normal",
          assigned_to: peopleByRole.finance_officer[index % peopleByRole.finance_officer.length].id,
          created_by: peopleByRole.finance_officer[0].id,
          student_id: invoice.student_id,
          parent_profile_id: parentByStudent[invoice.student_id],
          classroom_id: invoice.classroom_id,
          related_table: "invoices",
          related_record_id: invoice.id,
          metadata: betaMarker,
        })),
      ...gradebook.grades
        .filter((grade) => Number(grade.total_score ?? grade.score) < 50)
        .slice(0, 25)
        .map((grade, index) => ({
          task_number: `TASK-${runId}-ACA-${String(index + 1).padStart(3, "0")}`,
          title: `Academic intervention: ${grade.subject_name}`,
          description: "Low score detected; teacher should prepare remediation.",
          workflow_key: "academics.low_grade_intervention",
          status: "open",
          priority: "high",
          assigned_to: grade.graded_by,
          created_by: grade.graded_by,
          student_id: grade.student_id,
          parent_profile_id: parentByStudent[grade.student_id],
          classroom_id: students.find((student) => student.id === grade.student_id)?.classroom_id ?? null,
          related_table: "grades",
          related_record_id: grade.id,
          metadata: betaMarker,
        })),
    ],
  );
  await dbInsert(
    "account_lifecycle_records",
    [
      ...people.map((person) => ({
        profile_id: person.id,
        action: "created",
        reason: "Full-platform beta account creation.",
        performed_by: peopleByRole.super_admin[0].id,
        snapshot: { ...betaMarker, role: person.role, email: person.email },
      })),
      ...students.map((student) => ({
        profile_id: student.profile_id,
        student_id: student.id,
        action: "activated",
        reason: "Student activated for beta classroom workflows.",
        performed_by: peopleByRole.super_admin[0].id,
        snapshot: { ...betaMarker, student_number: student.student_number, classroom_id: student.classroom_id },
      })),
    ],
  );
  return true;
});

await step("audit beta platform readiness", async () => {
  const counts = {
    profiles: await countRows("profiles", (query) => query.contains("metadata", { beta_run_id: runId })),
    students: await countRows("students", (query) => query.contains("metadata", { beta_run_id: runId })),
    staffProfiles: await countRows("staff_profiles", (query) => query.contains("metadata", { beta_run_id: runId })),
    admissions: await countRows("admission_applications", (query) => query.contains("metadata", { beta_run_id: runId })),
    jobApplications: await countRows("job_applications", (query) => query.contains("metadata", { beta_run_id: runId })),
    invoices: await countRows("invoices", (query) => query.contains("metadata", { beta_run_id: runId })),
    payments: finance.payments.length,
    attendanceRegisters: await countRows("attendance_registers", (query) => query.contains("metadata", { beta_run_id: runId })),
    attendanceRecords: attendance.records.length,
    gradeItems: gradebook.gradeItems.length,
    grades: gradebook.grades.length,
    reports: await countRows("reports", (query) => query.contains("metadata", { beta_run_id: runId })),
    notifications: await countRows("notifications", (query) => query.contains("metadata", { beta_run_id: runId })),
    workflowTasks: await countRows("workflow_tasks", (query) => query.contains("metadata", { beta_run_id: runId })),
    supportTickets: await countRows("support_tickets", (query) => query.contains("metadata", { beta_run_id: runId })),
    devices: await countRows("devices", (query) => query.contains("metadata", { beta_run_id: runId })),
    campaignRecipients: await countRows("communication_recipients", (query) => query.contains("metadata", { beta_run_id: runId })),
  };
  report.accounts = Object.fromEntries(Object.entries(rolePlan).map(([role, expected]) => [role, { expected, actual: peopleByRole[role]?.length ?? 0 }]));
  report.counts = counts;
  assertCheck("created exactly 200 portal profiles", counts.profiles === 200, { expected: 200, actual: counts.profiles });
  for (const [role, expected] of Object.entries(rolePlan)) {
    assertCheck(`role count: ${role}`, (peopleByRole[role]?.length ?? 0) === expected, { expected, actual: peopleByRole[role]?.length ?? 0 });
  }
  assertCheck("created 110 students", counts.students === 110, { expected: 110, actual: counts.students });
  assertCheck("linked every student to a guardian", parentLinks.length === students.length, { expected: students.length, actual: parentLinks.length });
  assertCheck("created staff profiles for every operational account", counts.staffProfiles === 35, { expected: 35, actual: counts.staffProfiles });
  assertCheck("class curriculum has courses for all required subjects", courses.length === 64, { expected: 64, actual: courses.length });
  assertCheck("admissions workflow generated review records", counts.admissions === 24, { expected: 24, actual: counts.admissions });
  assertCheck("recruitment workflow generated applications", counts.jobApplications === 18, { expected: 18, actual: counts.jobApplications });
  assertCheck("finance generated one invoice per student", counts.invoices === students.length, { expected: students.length, actual: counts.invoices });
  assertCheck("payments were recorded for paid invoices", counts.payments > 0, { actual: counts.payments });
  assertCheck("attendance registers cover each class for five days", counts.attendanceRegisters === classrooms.length * 5, { expected: classrooms.length * 5, actual: counts.attendanceRegisters });
  assertCheck("attendance records cover every student for five days", counts.attendanceRecords === students.length * 5, { expected: students.length * 5, actual: counts.attendanceRecords });
  assertCheck("professional 30/70 gradebook covers class subjects", counts.grades === 704, { expected: 704, actual: counts.grades });
  assertCheck("published one report per student", counts.reports === students.length, { expected: students.length, actual: counts.reports });
  assertCheck("notifications include all roles plus parent invoice alerts", counts.notifications >= 300, { expectedAtLeast: 300, actual: counts.notifications });
  assertCheck("workflow automation tasks were created", counts.workflowTasks >= 30, { expectedAtLeast: 30, actual: counts.workflowTasks });
  assertCheck("IT help desk tickets were exercised", counts.supportTickets === 30, { expected: 30, actual: counts.supportTickets });
  assertCheck("device inventory was exercised", counts.devices === 30, { expected: 30, actual: counts.devices });
  assertCheck("communication campaign reached all profiles", counts.campaignRecipients === 200, { expected: 200, actual: counts.campaignRecipients });
  const sampleParent = peopleByRole.parent[0];
  const sampleStudentLink = parentLinks.find((link) => link.parent_profile_id === sampleParent.id);
  const sampleInvoices = finance.invoices.filter((invoice) => invoice.student_id === sampleStudentLink?.student_id);
  const sampleReports = reportsAndAnalytics.reports.filter((item) => item.student_id === sampleStudentLink?.student_id);
  assertCheck("sample parent sees linked ward finance and report data", Boolean(sampleStudentLink && sampleInvoices.length && sampleReports.length), {
    parent: sampleParent.email,
    invoices: sampleInvoices.length,
    reports: sampleReports.length,
  });
  const teacherCourseCounts = Map.groupBy(courses, (course) => course.teacher_id);
  assertCheck("teachers received assigned courses", teacherCourseCounts.size >= 10, { assignedTeachers: teacherCourseCounts.size });
  return counts;
});

report.finishedAt = new Date().toISOString();
const reportDir = path.join(cwd, "test-results", "beta");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `full-platform-beta-${runId}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const failedChecks = report.checks.filter((check) => check.status === "fail");
process.stdout.write(`\n\n[beta:${runId}] Report: ${reportPath}\n`);
process.stdout.write(`[beta:${runId}] Checks passed: ${report.checks.length - failedChecks.length}/${report.checks.length}\n`);
process.stdout.write(`[beta:${runId}] Profiles: ${report.counts.profiles}, students: ${report.counts.students}, grades: ${report.counts.grades}, attendance: ${report.counts.attendanceRecords}\n`);

if (report.failures.length > 0) {
  process.stdout.write(`[beta:${runId}] Failures: ${report.failures.length}\n`);
  process.exitCode = 1;
}
