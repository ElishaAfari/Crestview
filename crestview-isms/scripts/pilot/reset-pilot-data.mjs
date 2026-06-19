import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();
const nilUuid = "00000000-0000-0000-0000-000000000000";
const privateBuckets = [
  "admission-documents",
  "student-documents",
  "staff-documents",
  "recruitment-documents",
  "assignment-submissions",
  "lesson-resources",
  "report-cards",
  "message-attachments",
  "finance-documents",
  "system-backups"
];

function loadEnvFile(fileName) {
  const filePath = path.join(cwd, fileName);
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const execute = process.argv.includes("--execute");
const preserveArg = process.argv.find((arg) => arg.startsWith("--preserve-email="));
const preserveEmail = (preserveArg?.split("=")[1] || process.env.PILOT_SUPER_ADMIN_EMAIL || "afarielisha00@gmail.com").toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function isMissingTable(error) {
  return error && (error.code === "PGRST205" || error.code === "42P01" || /relation .* does not exist|Could not find the table/i.test(error.message ?? ""));
}

async function step(label, fn) {
  process.stdout.write(`[pilot-reset] ${label}... `);
  const result = await fn();
  process.stdout.write(`${result ?? "ok"}\n`);
  return result;
}

async function deleteAll(table, column = "id") {
  if (!execute) return "dry-run";
  const query = supabase.from(table).delete({ count: "exact" });
  const { error, count } = await (column === "id" ? query.neq("id", nilUuid) : query.not(column, "is", null));
  if (isMissingTable(error)) return "skipped";
  if (error) throw new Error(`${table}: ${error.message}`);
  return String(count ?? 0);
}

async function deleteProfilesExcept(profileId) {
  if (!execute) return "dry-run";
  const { error, count } = await supabase.from("profiles").delete({ count: "exact" }).neq("id", profileId);
  if (error) throw new Error(`profiles: ${error.message}`);
  return String(count ?? 0);
}

async function listAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth listUsers: ${error.message}`);
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < 1000) break;
    page += 1;
  }
  return users;
}

async function purgeBucket(bucketName) {
  async function walk(prefix = "") {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error) {
      if (/not found|does not exist/i.test(error.message)) return 0;
      throw new Error(`${bucketName}: ${error.message}`);
    }
    let removed = 0;
    const files = [];
    for (const item of data ?? []) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id || item.metadata) files.push(itemPath);
      else removed += await walk(itemPath);
    }
    if (files.length && execute) {
      const { error: removeError } = await supabase.storage.from(bucketName).remove(files);
      if (removeError) throw new Error(`${bucketName}: ${removeError.message}`);
    }
    return removed + files.length;
  }
  return walk();
}

async function seedAcademicSkeleton() {
  if (!execute) return "dry-run";
  const departments = [
    { code: "ADMIN", name: "Administration", description: "School leadership and office operations" },
    { code: "ACA", name: "Academics", description: "Teaching, learning, and assessment" },
    { code: "FIN", name: "Finance", description: "Fees, billing, payroll, and expenditure" },
    { code: "OPS", name: "Operations", description: "Facilities, transport, library, and IT support" },
    { code: "ENRICH", name: "STEM, Robotics, Music and Creative Arts", description: "Enrichment programmes and practical learning" }
  ];
  const { data: departmentRows, error: departmentError } = await supabase
    .from("departments")
    .upsert(departments, { onConflict: "code" })
    .select("id,code");
  if (departmentError) throw new Error(`departments: ${departmentError.message}`);
  const departmentsByCode = new Map((departmentRows ?? []).map((department) => [department.code, department.id]));
  const subjects = [
    ["LIT", "Literacy", "ACA"],
    ["NUM", "Numeracy", "ACA"],
    ["CART", "Creative Arts", "ENRICH"],
    ["OWOP", "OWOP", "ACA"],
    ["WRIT", "Writing", "ACA"],
    ["MATH", "Maths", "ACA"],
    ["ENG", "English", "ACA"],
    ["RME", "RME", "ACA"],
    ["DLIT", "Digital Literacy", "ENRICH"],
    ["GLANG", "Ghanaian Language", "ACA"],
    ["FRE", "French", "ACA"],
    ["HIST", "History", "ACA"]
  ].map(([code, name, departmentCode]) => ({ code, name, department_id: departmentsByCode.get(departmentCode) ?? null, credit_hours: 1 }));
  const { data: subjectRows, error: subjectError } = await supabase.from("subjects").upsert(subjects, { onConflict: "code" }).select("id,code");
  if (subjectError) throw new Error(`subjects: ${subjectError.message}`);
  const subjectsByCode = new Map((subjectRows ?? []).map((subject) => [subject.code, subject.id]));

  await supabase.from("academic_years").update({ is_current: false }).neq("id", nilUuid);
  const { data: academicYear, error: yearError } = await supabase
    .from("academic_years")
    .upsert({
      name: "2026/2027 Academic Year",
      start_date: "2026-09-01",
      end_date: "2027-07-31",
      is_current: true
    }, { onConflict: "name" })
    .select("id")
    .single();
  if (yearError || !academicYear) throw new Error(`academic_years: ${yearError?.message ?? "not created"}`);

  const terms = [
    { name: "Term 1", starts_on: "2026-09-01", ends_on: "2026-12-18", is_current: true },
    { name: "Term 2", starts_on: "2027-01-12", ends_on: "2027-04-02", is_current: false },
    { name: "Term 3", starts_on: "2027-05-04", ends_on: "2027-07-30", is_current: false }
  ].map((term) => ({ ...term, academic_year_id: academicYear.id }));
  const { error: termError } = await supabase.from("terms").upsert(terms, { onConflict: "academic_year_id,name" });
  if (termError) throw new Error(`terms: ${termError.message}`);

  const classNames = [
    "Nursery 1",
    "Nursery 2",
    "KG 1",
    "KG 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JHS 1",
    "JHS 2",
    "JHS 3"
  ];
  const classrooms = classNames.map((name) => ({ name, grade_level: name, academic_year_id: academicYear.id, capacity: 35 }));
  const { data: classroomRows, error: classroomError } = await supabase.from("classrooms").upsert(classrooms, { onConflict: "name,academic_year_id" }).select("id,name");
  if (classroomError) throw new Error(`classrooms: ${classroomError.message}`);

  const nurserySubjects = ["LIT", "NUM", "CART"];
  const kgSubjects = ["LIT", "NUM", "CART", "OWOP", "WRIT"];
  const primarySubjects = ["MATH", "ENG", "RME", "CART", "DLIT", "GLANG", "FRE", "HIST"];
  const courseRows = [];
  for (const classroom of classroomRows ?? []) {
    const codes = classroom.name.startsWith("Nursery")
      ? nurserySubjects
      : classroom.name.startsWith("KG")
        ? kgSubjects
        : classroom.name.startsWith("Primary")
          ? primarySubjects
          : [];
    for (const code of codes) {
      const subjectId = subjectsByCode.get(code);
      if (!subjectId) continue;
      for (const term of ["Term 1", "Term 2", "Term 3"]) {
        courseRows.push({ subject_id: subjectId, classroom_id: classroom.id, academic_year_id: academicYear.id, term });
      }
    }
  }
  if (courseRows.length) {
    const { error: courseError } = await supabase.from("courses").upsert(courseRows, { onConflict: "subject_id,classroom_id,academic_year_id,term" });
    if (courseError) throw new Error(`courses: ${courseError.message}`);
  }

  await supabase.from("school_settings").upsert({
    key: "official_contacts",
    value: {
      phones: ["0245131619", "0546767992", "0270616220"],
      address: "Asamankese Yayo, former Omega School premises",
      admissions_form: "Crestview Admission Form.pdf",
      pilot_ready_at: new Date().toISOString()
    },
    description: "Official school contact information and pilot readiness metadata",
    is_public: true
  }, { onConflict: "key" });

  return `${classrooms.length} classes, ${subjects.length} subjects, ${courseRows.length} courses`;
}

const operationalDeletePlan = [
  ["communication_recipients"],
  ["message_attachments"],
  ["conversation_members", "conversation_id"],
  ["messages"],
  ["announcement_reads"],
  ["assignment_attachments"],
  ["submission_attachments"],
  ["lesson_plan_resources"],
  ["staff_documents"],
  ["student_documents"],
  ["job_application_documents"],
  ["job_application_status_history"],
  ["admission_assessments"],
  ["admission_interviews"],
  ["admission_documents"],
  ["admission_guardians"],
  ["admission_status_history"],
  ["students"],
  ["library_fines"],
  ["library_loans"],
  ["student_transport_assignments"],
  ["support_ticket_comments"],
  ["ai_tutor_messages"],
  ["parent_students", "parent_profile_id"],
  ["teacher_assignments"],
  ["staff_class_assignments"],
  ["grades"],
  ["grade_items"],
  ["grade_import_batches"],
  ["assignment_submissions"],
  ["assignments"],
  ["attendance_records"],
  ["attendance_registers"],
  ["payments"],
  ["payment_allocations"],
  ["invoice_items"],
  ["invoices"],
  ["billing_batches"],
  ["fee_plan_items"],
  ["fee_plans"],
  ["fee_categories"],
  ["expenses"],
  ["payment_webhook_events"],
  ["payroll_items"],
  ["payroll_periods"],
  ["student_scholarships"],
  ["scholarships"],
  ["reports"],
  ["workflow_tasks"],
  ["student_360_notes"],
  ["notifications"],
  ["notification_preferences"],
  ["email_outbox"],
  ["sms_outbox"],
  ["push_subscriptions"],
  ["ai_rate_limits"],
  ["ai_usage_logs"],
  ["ai_tutor_sessions"],
  ["ai_analytics"],
  ["audit_logs"],
  ["account_lifecycle_records"],
  ["admission_applications"],
  ["job_applications"],
  ["job_postings"],
  ["leave_requests"],
  ["staff_attendance_records"],
  ["staff_profiles"],
  ["student_behavior_records"],
  ["student_medical_records"],
  ["student_enrollments"],
  ["class_roster_snapshots"],
  ["student_promotion_records"],
  ["class_promotion_batches"],
  ["lesson_plans"],
  ["curriculum_units"],
  ["course_materials"],
  ["exam_sessions"],
  ["timetables"],
  ["courses"],
  ["library_copies"],
  ["library_books"],
  ["transport_stops"],
  ["transport_routes"],
  ["devices"],
  ["support_tickets"],
  ["communication_campaigns"],
  ["conversations"],
  ["files"],
  ["portal_invitations"],
  ["contact_inquiries"],
  ["events"],
  ["news_posts"],
  ["hero_slides"],
  ["media_assets"],
  ["announcements"],
  ["system_jobs"],
  ["integration_events"],
  ["school_days"],
  ["terms"],
  ["classrooms"],
  ["academic_years"],
  ["subjects"],
  ["departments"]
];

const profileDependentConfigTables = ["automation_rules", "school_settings"];

const { data: preservedProfile, error: preservedError } = await supabase
  .from("profiles")
  .select("id,email,roles(name)")
  .eq("email", preserveEmail)
  .maybeSingle();
if (preservedError) throw new Error(`preserved profile lookup failed: ${preservedError.message}`);
if (!preservedProfile) throw new Error(`No profile found for preserved super admin email ${preserveEmail}.`);
const roleName = Array.isArray(preservedProfile.roles) ? preservedProfile.roles[0]?.name : preservedProfile.roles?.name;
if (roleName !== "super_admin") throw new Error(`Preserved account ${preserveEmail} is not a super_admin.`);

process.stdout.write(`[pilot-reset] Mode: ${execute ? "EXECUTE" : "DRY RUN"}\n`);
process.stdout.write(`[pilot-reset] Preserving super admin: ${preserveEmail} (${preservedProfile.id})\n`);
if (!execute) process.stdout.write("[pilot-reset] Re-run with --execute to wipe data.\n");

await step("clear profile-dependent config references", async () => {
  if (!execute) return "dry-run";
  for (const table of profileDependentConfigTables) {
    const { error } = await supabase.from(table).update({ created_by: null, last_triggered_at: null }).neq("id", nilUuid);
    if (error && !isMissingTable(error)) {
      if (table === "school_settings" && /last_triggered_at/i.test(error.message)) {
        const retry = await supabase.from(table).update({ created_by: null }).neq("id", nilUuid);
        if (retry.error) throw new Error(`${table}: ${retry.error.message}`);
      } else {
        throw new Error(`${table}: ${error.message}`);
      }
    }
  }
  return "ok";
});

await step("clear admission-student cross links", async () => {
  if (!execute) return "dry-run";
  const admissionUpdate = await supabase
    .from("admission_applications")
    .update({ accepted_student_id: null, parent_profile_id: null, assigned_to: null })
    .neq("id", nilUuid);
  if (admissionUpdate.error && !isMissingTable(admissionUpdate.error)) throw new Error(`admission_applications: ${admissionUpdate.error.message}`);
  const studentUpdate = await supabase.from("students").update({ admission_application_id: null }).neq("id", nilUuid);
  if (studentUpdate.error && !isMissingTable(studentUpdate.error)) throw new Error(`students: ${studentUpdate.error.message}`);
  return "ok";
});

for (const [table, column] of operationalDeletePlan) {
  await step(`delete ${table}`, () => deleteAll(table, column));
}

await step("delete auth users except preserved super admin", async () => {
  if (!execute) return "dry-run";
  const users = await listAuthUsers();
  let deleted = 0;
  for (const user of users) {
    if (user.id === preservedProfile.id || user.email?.toLowerCase() === preserveEmail) continue;
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`auth delete ${user.email ?? user.id}: ${error.message}`);
    deleted += 1;
  }
  return String(deleted);
});

await step("delete non-preserved profiles", () => deleteProfilesExcept(preservedProfile.id));

await step("restore preserved super admin profile", async () => {
  if (!execute) return "dry-run";
  const { data: superRole, error: roleError } = await supabase.from("roles").select("id").eq("name", "super_admin").single();
  if (roleError || !superRole) throw new Error(`super_admin role: ${roleError?.message ?? "missing"}`);
  const { error } = await supabase.from("profiles").update({
    role_id: superRole.id,
    is_active: true,
    deleted_at: null,
    metadata: { account_source: "head_bootstrap", pilot_preserved: true }
  }).eq("id", preservedProfile.id);
  if (error) throw new Error(`restore profile: ${error.message}`);
  return "ok";
});

await step("purge private storage buckets", async () => {
  let removed = 0;
  for (const bucket of privateBuckets) removed += await purgeBucket(bucket);
  return `${removed} objects`;
});

await step("seed clean academic pilot skeleton", seedAcademicSkeleton);

await step("count remaining people records", async () => {
  const [profiles, students, staff, admissions, jobs] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("staff_profiles").select("*", { count: "exact", head: true }),
    supabase.from("admission_applications").select("*", { count: "exact", head: true }),
    supabase.from("job_applications").select("*", { count: "exact", head: true })
  ]);
  for (const result of [profiles, students, staff, admissions, jobs]) {
    if (result.error && !isMissingTable(result.error)) throw new Error(result.error.message);
  }
  return `profiles=${profiles.count ?? 0}, students=${students.count ?? 0}, staff=${staff.count ?? 0}, admissions=${admissions.count ?? 0}, recruitment=${jobs.count ?? 0}`;
});

process.stdout.write("[pilot-reset] Complete.\n");
