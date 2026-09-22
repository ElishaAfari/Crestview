"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createPortalInvitation } from "@/lib/email/portal-access";
import { generateStudentNumber, isSupportedStudentNumber, normalizeStudentNumber } from "@/lib/students/student-number";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentSchema } from "@/lib/validations/student.schema";
import type { Json } from "@/types/database.types";

type ImportRow = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  className: string;
  sectionName: string;
  enrollmentDate: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  phone: string;
  address: string;
  city: string;
  region: string;
  status: "active" | "graduated" | "withdrawn" | "suspended";
};

function normalizeHeader(value: string) {
  const key = value.replace(/^\uFEFF/, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const aliases: Record<string, string> = {
    firstname: "first_name", given_name: "first_name", forename: "first_name",
    lastname: "last_name", surname: "last_name", family_name: "last_name",
    student_name: "full_name", learner_name: "full_name", child_name: "full_name",
    admission_no: "student_id", admission_number: "student_id", admission_id: "student_id",
    index_no: "student_id", index_number: "student_id", student_no: "student_id", student_number: "student_id", student_code: "student_id", registration_number: "student_id",
    class_name: "class", class_level: "class", grade_level: "class", form: "class",
    date_of_admission: "enrollment_date", date_enrolled: "enrollment_date", admission_date: "enrollment_date",
    sex: "gender", mobile: "phone", phone_number: "phone", contact: "phone", telephone: "phone",
    email_address: "email", student_email: "email", guardian_email: "email"
  };
  return aliases[key] ?? key;
}

function normalizeClassName(value: string) {
  const key = value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const aliases: Record<string, string> = {
    creche: "nursery 1",
    "playgroup 1": "nursery 1",
    "playgroup 2": "nursery 2",
    "early year 1": "kg 1",
    "early year 2": "kg 2"
  };
  if (aliases[key]) return aliases[key];
  const crestMatch = key.match(/^crest\s*([1-7])$/);
  if (crestMatch) return Number(crestMatch[1]) <= 6 ? `primary ${crestMatch[1]}` : "jhs 1";
  return key;
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [",", ";", "\t"];
  const delimiter = delimiters.reduce((best, candidate) => firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ",");
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function importValue(row: Record<string, string>, ...names: string[]) {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (value?.trim()) return value.trim();
  }
  return "";
}

function normalizeImportRow(row: Record<string, string>): ImportRow {
  const gender = importValue(row, "gender").toLowerCase();
  const fullName = importValue(row, "full_name");
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: importValue(row, "first_name") || nameParts[0] || "",
    middleName: importValue(row, "middle_name"),
    lastName: importValue(row, "last_name") || nameParts.slice(1).join(" "),
    email: importValue(row, "email", "student_email"),
    studentNumber: importValue(row, "student_id", "student_number", "id", "index_number"),
    className: importValue(row, "class", "classroom", "class_name", "grade"),
    sectionName: importValue(row, "section", "section_name", "stream"),
    enrollmentDate: importValue(row, "enrollment_date", "date_enrolled", "enrollment date") || new Date().toISOString().slice(0, 10),
    dateOfBirth: importValue(row, "date_of_birth", "dob", "birth_date"),
    gender: ["male", "female", "other", "prefer_not_to_say"].includes(gender) ? gender as ImportRow["gender"] : null,
    phone: importValue(row, "phone", "parent_phone", "guardian_phone"),
    address: importValue(row, "address", "home_address"),
    city: importValue(row, "city", "town"),
    region: importValue(row, "region"),
    status: (["active", "graduated", "withdrawn", "suspended"] as const).includes(importValue(row, "status").toLowerCase() as ImportRow["status"])
      ? importValue(row, "status").toLowerCase() as ImportRow["status"]
      : "active"
  };
}

export async function importStudentsCsvAction(formData: FormData) {
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, message: "Choose a CSV file to import." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "The CSV must be smaller than 5 MB." };

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return { ok: false, message: "The CSV needs a header row and at least one student row." };
  const headers = rows[0].map(normalizeHeader);
  const normalizedRows = rows.slice(1).map((values) => normalizeImportRow(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))));
  if (normalizedRows.length > 500) return { ok: false, message: "Import up to 500 students per batch. Split larger registers into separate files." };

  const admin = createAdminClient();
  const { data: classrooms, error: classError } = await admin.from("classrooms").select("id,name,grade_level").is("deleted_at", null);
  if (classError) return { ok: false, message: "Classrooms could not be loaded for this import." };
  const classMap = new Map<string, { id: string; name: string; grade_level: string }>();
  for (const classroom of classrooms ?? []) {
    const value = classroom as { id: string; name: string; grade_level: string };
    classMap.set(normalizeClassName(value.name), value);
    classMap.set(normalizeClassName(value.grade_level), value);
    classMap.set(normalizeClassName(`${value.grade_level} - ${value.name}`), value);
  }

  const errors: string[] = [];
  const seenIds = new Set<string>();
  const created: string[] = [];
  const skipped: string[] = [];
  for (const [index, input] of normalizedRows.entries()) {
    const line = index + 2;
    const classroom = classMap.get(normalizeClassName(input.className));
    if (!input.firstName || !input.lastName || !input.className) { errors.push(`Row ${line}: first_name, last_name, and class are required.`); continue; }
    if (!classroom) { errors.push(`Row ${line}: class \"${input.className}\" was not found.`); continue; }
    if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) { errors.push(`Row ${line}: email is not valid.`); continue; }
    if (input.dateOfBirth && !isDate(input.dateOfBirth)) { errors.push(`Row ${line}: date_of_birth must use YYYY-MM-DD.`); continue; }
    if (input.enrollmentDate && !isDate(input.enrollmentDate)) { errors.push(`Row ${line}: admission_date/enrollment_date must use YYYY-MM-DD.`); continue; }
    let studentNumber = normalizeStudentNumber(input.studentNumber);
    const sourceStudentId = input.studentNumber || null;
    if (studentNumber && (!isSupportedStudentNumber(studentNumber) || !/^\d{8}$/.test(studentNumber))) studentNumber = "";
    if (!studentNumber) studentNumber = await generateStudentNumber(admin);
    if (seenIds.has(studentNumber)) { errors.push(`Row ${line}: duplicate student_id ${studentNumber} in this file.`); continue; }
    seenIds.add(studentNumber);
    const { count } = await admin.from("students").select("id", { count: "exact", head: true }).eq("student_number", studentNumber);
    if ((count ?? 0) > 0) { skipped.push(`${input.firstName} ${input.lastName} (${studentNumber})`); continue; }

    const email = input.email.toLowerCase() || `student.${studentNumber}@crestview.local`;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { account_source: "student_csv_import", first_name: input.firstName, last_name: input.lastName }
    });
    if (authError || !authData.user) { errors.push(`Row ${line}: account could not be created${authError?.message ? ` (${authError.message})` : ""}.`); continue; }
    const { data: role } = await admin.from("roles").select("id").eq("name", "student").single();
    const metadata = {
      import_source: "students_csv_import",
      source_file: file.name,
      source_student_id: sourceStudentId,
      source_class_name: input.className,
      source_section_name: input.sectionName || null,
      source_status: input.status,
      source_address: input.address || null,
      source_city: input.city || null,
      source_region: input.region || null
    } satisfies Json;
    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      role_id: role?.id,
      first_name: input.firstName,
      middle_name: input.middleName || null,
      last_name: input.lastName,
      email,
      phone: input.phone || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender,
      address: input.address || input.city || input.region ? { line1: input.address || null, city: input.city || null, region: input.region || null } : null,
      is_active: input.status === "active" || input.status === "graduated",
      metadata
    });
    const { error: studentError } = profileError ? { error: profileError } : await admin.from("students").insert({
      profile_id: authData.user.id,
      student_number: studentNumber,
      classroom_id: classroom.id,
      enrollment_date: input.enrollmentDate,
      status: input.status,
      metadata
    });
    if (profileError || studentError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      errors.push(`Row ${line}: student record could not be saved.`);
      continue;
    }
    created.push(`${input.firstName} ${input.lastName} (${studentNumber}${sourceStudentId ? `, source ${sourceStudentId}` : ""})`);
  }

  await admin.from("audit_logs").insert({ actor_id: user.id, action: "students_csv_imported", table_name: "students", after: { created_count: created.length, skipped_count: skipped.length, error_count: errors.length, source_file: file.name } satisfies Json });
  revalidatePath("/students");
  revalidatePath("/admin/students");
  return { ok: errors.length === 0, message: `${created.length} students imported, ${skipped.length} already existed.${errors.length ? ` ${errors.length} rows need attention.` : ""}`, errors: errors.slice(0, 25) };
}

export async function createStudentAction(formData: FormData) {
  const result = studentSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    studentNumber: String(formData.get("studentNumber") ?? ""),
    classroomId: String(formData.get("classroomId") ?? ""),
    enrollmentDate: String(formData.get("enrollmentDate") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the student details." };

  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const email = result.data.email.trim().toLowerCase();
  const providedStudentNumber = normalizeStudentNumber(result.data.studentNumber ?? "");
  const studentNumber = providedStudentNumber || await generateStudentNumber(admin);
  if (!isSupportedStudentNumber(studentNumber)) return { ok: false, message: "Use an 8-digit student ID or leave it blank for automatic generation." };
  const { data: studentRole } = await admin.from("roles").select("id").eq("name", "student").single();
  if (!studentRole) return { ok: false, message: "The student role is not configured." };

  const invite = await createPortalInvitation({
    admin,
    email,
    firstName: result.data.firstName.trim(),
    lastName: result.data.lastName.trim(),
    role: "student",
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { account_source: "manual_student_enrollment" }
  });
  if (!invite.ok) return { ok: false, message: invite.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: studentRole.id,
    first_name: result.data.firstName.trim(),
    last_name: result.data.lastName.trim(),
    email
  });
  const { error: studentError } = profileError ? { error: profileError } : await admin.from("students").insert({
    profile_id: invite.user.id,
    student_number: studentNumber,
    classroom_id: result.data.classroomId,
    enrollment_date: result.data.enrollmentDate
  });

  if (profileError || studentError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return { ok: false, message: "The student record could not be created. Check the student number and classroom." };
  }

  const delivery = invite.delivery === "crestview" ? "Crestview-branded access email" : "Supabase Auth access email";
  return { ok: true, message: `Student invited and enrolled as ${studentNumber}. QR ID card generated. ${delivery} sent to ${invite.deliveredTo}.` };
}

export async function withdrawStudentAction(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const reason = String(formData.get("reason") ?? "Withdrawn from administrator student management").trim();
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data: studentData } = await admin
    .from("students")
    .select("id,profile_id,student_number,status,classroom_id,metadata")
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();
  const student = studentData as { id: string; profile_id: string; student_number: string; status: string; classroom_id: string | null; metadata: Json | null } | null;
  if (!student) return { ok: false, message: "The student record could not be found." };

  await admin.auth.admin.updateUserById(student.profile_id, { ban_duration: "876000h" });
  const { error } = await admin.from("students").update({
    status: "withdrawn",
    classroom_id: null,
    metadata: {
      ...(typeof student.metadata === "object" && !Array.isArray(student.metadata) ? student.metadata : {}),
      withdrawn_at: new Date().toISOString(),
      previous_classroom_id: student.classroom_id,
      reason
    } satisfies Json
  }).eq("id", student.id);
  if (!error) {
    await admin.from("profiles").update({ is_active: false }).eq("id", student.profile_id);
    await admin.from("account_lifecycle_records").insert({
      profile_id: student.profile_id,
      student_id: student.id,
      action: "withdrawn",
      reason,
      performed_by: user.id,
      snapshot: { student_number: student.student_number, previous_status: student.status, previous_classroom_id: student.classroom_id }
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return error ? { ok: false, message: "The student could not be withdrawn." } : { ok: true, message: "Student withdrawn and portal access disabled. Historical records are preserved." };
}

export async function promoteClassAction(formData: FormData) {
  const fromClassroomId = String(formData.get("fromClassroomId") ?? "");
  const toClassroomId = String(formData.get("toClassroomId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  if (!fromClassroomId || !toClassroomId || fromClassroomId === toClassroomId) {
    return { ok: false, message: "Choose two different classes for promotion." };
  }

  const admin = createAdminClient();
  const { data: students } = await admin
    .from("students")
    .select("id,status")
    .eq("classroom_id", fromClassroomId)
    .eq("status", "active")
    .is("deleted_at", null);
  const studentRows = (students ?? []) as Array<{ id: string; status: string }>;
  if (!studentRows.length) return { ok: false, message: "No active students were found in the source class." };

  const { data: toClassroom } = await admin.from("classrooms").select("id,academic_year_id").eq("id", toClassroomId).is("deleted_at", null).maybeSingle();
  const target = toClassroom as { id: string; academic_year_id: string | null } | null;
  if (!target) return { ok: false, message: "The destination class could not be found." };

  const batchNumber = `PROMO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const { data: batchData, error: batchError } = await admin.from("class_promotion_batches").insert({
    batch_number: batchNumber,
    from_classroom_id: fromClassroomId,
    to_classroom_id: toClassroomId,
    academic_year_id: target.academic_year_id,
    promoted_by: user.id,
    student_count: studentRows.length,
    notes: notes || null
  }).select("id").single();
  const batch = batchData as { id: string } | null;
  if (batchError || !batch) return { ok: false, message: "The promotion batch could not be created." };

  await admin.from("student_promotion_records").insert(studentRows.map((student) => ({
    promotion_batch_id: batch.id,
    student_id: student.id,
    from_classroom_id: fromClassroomId,
    to_classroom_id: toClassroomId,
    previous_status: student.status,
    promoted_by: user.id
  })));
  const { error } = await admin.from("students").update({ classroom_id: toClassroomId }).in("id", studentRows.map((student) => student.id));
  if (!error) {
    await admin.from("account_lifecycle_records").insert({
      action: "promoted",
      reason: `Class promotion ${batchNumber}`,
      performed_by: user.id,
      snapshot: { from_classroom_id: fromClassroomId, to_classroom_id: toClassroomId, student_count: studentRows.length }
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/teacher/classes");
  revalidatePath("/admin");
  return error ? { ok: false, message: "Students could not be promoted." } : { ok: true, message: `${studentRows.length} students promoted under ${batchNumber}.` };
}
