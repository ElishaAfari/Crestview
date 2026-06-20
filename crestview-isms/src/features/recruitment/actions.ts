"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createPortalInvitation } from "@/lib/email/portal-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWorkflowTask } from "@/features/automation/actions";
import { jobApplicationSchema } from "@/lib/validations/recruitment.schema";
import type { Json, RoleName } from "@/types/database.types";

const jobPostingSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title.").max(140),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  description: z.string().trim().min(20, "Describe the role and expected fit.").max(4000),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  closesOn: z.string().optional().or(z.literal("")),
  isActive: z.boolean()
});

export async function createJobPostingAction(formData: FormData) {
  const result = jobPostingSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    employmentType: String(formData.get("employmentType") ?? "full_time"),
    description: String(formData.get("description") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    closesOn: String(formData.get("closesOn") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true"
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the job posting." };

  const { user } = await requireRoles(["super_admin", "school_admin", "hr_staff"]);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_postings")
    .insert({
      title: result.data.title,
      department_id: result.data.departmentId || null,
      employment_type: result.data.employmentType,
      description: result.data.description,
      closes_on: result.data.closesOn || null,
      is_active: result.data.isActive
    })
    .select("id")
    .single();
  const posting = data as { id: string } | null;
  if (error || !posting) return { ok: false, message: "The job posting could not be created." };

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "CREATE job_posting",
      table_name: "job_postings",
      record_id: posting.id,
      after: {
        title: result.data.title,
        employment_type: result.data.employmentType,
        is_active: result.data.isActive
      } satisfies Json
    }),
    createWorkflowTask({
      title: `Review applicants for ${result.data.title}`,
      workflowKey: "hr_follow_up",
      description: "Monitor website recruitment submissions and shortlist candidates for this open posting.",
      priority: "normal",
      createdBy: user.id,
      relatedTable: "job_postings",
      relatedRecordId: posting.id,
      metadata: { source: "job_posting_create", public_posting: result.data.isActive } satisfies Json
    })
  ]);

  revalidatePath("/recruitment");
  revalidatePath("/admin/recruitment");
  revalidatePath("/hr");
  revalidatePath("/hr/recruitment");
  return { ok: true, message: "Job posting created and published to the recruitment page." };
}

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function staffRoleForTitle(title: string | null | undefined): RoleName {
  const value = (title ?? "").toLowerCase();
  if (value.includes("finance") || value.includes("account") || value.includes("bursar")) return "finance_officer";
  if (value.includes("library") || value.includes("librarian")) return "librarian";
  if (value.includes("it ") || value.includes("technology") || value.includes("support")) return "it_support";
  if (value.includes("hr") || value.includes("human resource")) return "hr_staff";
  return "teacher";
}

function requestedStaffRole(value: string | null | undefined, fallbackTitle: string | null | undefined): RoleName {
  const allowed = new Set<RoleName>(["teacher", "hr_staff", "finance_officer", "librarian", "it_support"]);
  return allowed.has(value as RoleName) ? value as RoleName : staffRoleForTitle(fallbackTitle);
}

async function notifyAdministrators(title: string, body: string, metadata: Json) {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id,roles(name)").is("deleted_at", null).eq("is_active", true);
  const recipients = ((profiles ?? []) as unknown as Array<{ id: string; roles: { name: string } | { name: string }[] | null }>)
    .filter((profile) => {
      const role = one(profile.roles)?.name;
      return role === "super_admin" || role === "school_admin";
    })
    .map((profile) => profile.id);
  if (!recipients.length) return;
  await admin.from("notifications").insert(recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title,
    body,
    type: "workflow",
    metadata
  })));
}

export async function submitJobApplicationAction(formData: FormData) {
  const result = jobApplicationSchema.safeParse({
    jobPostingId: String(formData.get("jobPostingId") ?? "") || undefined,
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
    coverLetter: String(formData.get("coverLetter") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the application." };

  const admin = createAdminClient();
  const { data: application, error } = await admin.from("job_applications").insert({
    job_posting_id: result.data.jobPostingId ?? null,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    email: result.data.email.toLowerCase(),
    phone: result.data.phone ?? null,
    cover_letter: result.data.coverLetter,
    status: "submitted",
    metadata: { source: "school_website" }
  }).select("id").single();

  const applicationRecord = application as { id: string } | null;
  if (error || !applicationRecord) return { ok: false, message: "We could not submit your application. Please call the school for assistance." };
  await notifyAdministrators(
    "New recruitment application",
    `${result.data.firstName} ${result.data.lastName} applied through the website.`,
    { job_application_id: applicationRecord.id, source: "school_website" }
  );
  revalidatePath("/admin/recruitment");
  revalidatePath("/hr/recruitment");
  return { ok: true, message: "Application received. The school team will review it shortly." };
}

async function findProfileByEmail(email: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id,email").eq("email", email.toLowerCase()).maybeSingle();
  return data as { id: string; email: string } | null;
}

async function assignTeacherToClass(profileId: string, classroomId: string | null, actorId: string) {
  if (!classroomId) return;
  const admin = createAdminClient();
  const { data: classroom } = await admin.from("classrooms").select("id,academic_year_id").eq("id", classroomId).is("deleted_at", null).maybeSingle();
  const record = classroom as { id: string; academic_year_id: string | null } | null;
  if (!record) return;

  await admin.from("staff_class_assignments").upsert({
    profile_id: profileId,
    classroom_id: record.id,
    academic_year_id: record.academic_year_id,
    assignment_type: "class_teacher",
    status: "active",
    assigned_by: actorId
  }, { onConflict: "profile_id,classroom_id,academic_year_id,assignment_type" });

  const { data: courses } = await admin.from("courses").select("id,teacher_id").eq("classroom_id", record.id).is("deleted_at", null);
  const courseRows = (courses ?? []) as Array<{ id: string; teacher_id: string | null }>;
  if (!courseRows.length) return;

  await admin.from("teacher_assignments").upsert(courseRows.map((course) => ({
    teacher_id: profileId,
    course_id: course.id,
    role: "class_teacher"
  })), { onConflict: "teacher_id,course_id" });

  const leadlessCourseIds = courseRows.filter((course) => !course.teacher_id).map((course) => course.id);
  if (leadlessCourseIds.length) await admin.from("courses").update({ teacher_id: profileId }).in("id", leadlessCourseIds);
}

async function createStaffFromApplication(applicationId: string, actorId: string, roleOverride?: string, classroomId?: string) {
  const admin = createAdminClient();
  const { data: application } = await admin
    .from("job_applications")
    .select("id,first_name,last_name,email,phone,status,job_postings(title,employment_type)")
    .eq("id", applicationId)
    .maybeSingle();
  const record = application as unknown as {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    status: string;
    job_postings: { title: string | null; employment_type: string | null } | { title: string | null; employment_type: string | null }[] | null;
  } | null;
  if (!record) return { ok: false, message: "The application no longer exists." };
  if (record.status === "hired") return { ok: true, message: "This applicant has already been accepted." };

  const email = record.email.toLowerCase();
  const existingProfile = await findProfileByEmail(email);
  if (existingProfile) return { ok: false, message: "A portal profile already exists for this email. Use User Management to adjust access." };

  const posting = one(record.job_postings);
  const roleName = requestedStaffRole(roleOverride, posting?.title);
  const { data: role } = await admin.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (!role) return { ok: false, message: "The matching staff role is not configured." };

  const invite = await createPortalInvitation({
    admin,
    email,
    firstName: record.first_name,
    lastName: record.last_name,
    role: roleName,
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { application_source: "recruitment", account_source: "recruitment_acceptance", job_application_id: record.id }
  });
  if (!invite.ok) return { ok: false, message: invite.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: role.id,
    first_name: record.first_name,
    last_name: record.last_name,
    email,
    phone: record.phone,
    metadata: { account_source: "recruitment_acceptance", job_application_id: record.id }
  });
  const staffNumber = `CIS-STF-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  const { error: staffProfileError } = profileError ? { error: profileError } : await admin.from("staff_profiles").insert({
    profile_id: invite.user.id,
    staff_number: staffNumber,
    job_title: posting?.title ?? roleName.replaceAll("_", " "),
    employment_type: posting?.employment_type ?? "full_time",
    hire_date: new Date().toISOString().slice(0, 10),
    metadata: { job_application_id: record.id }
  });
  const { error: invitationError } = profileError || staffProfileError ? { error: profileError ?? staffProfileError } : await admin.from("portal_invitations").insert({
    email,
    role_id: role.id,
    first_name: record.first_name,
    last_name: record.last_name,
    auth_user_id: invite.user.id,
    metadata: { account_source: "recruitment_acceptance", job_application_id: record.id }
  });

  if (profileError || staffProfileError || invitationError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return { ok: false, message: "The staff account could not be created." };
  }

  if (roleName === "teacher") {
    await assignTeacherToClass(invite.user.id, classroomId && z.string().uuid().safeParse(classroomId).success ? classroomId : null, actorId);
  }

  await admin.from("job_applications").update({
    status: "hired",
    assigned_to: invite.user.id
  }).eq("id", record.id);
  await admin.from("job_application_status_history").insert({
    job_application_id: record.id,
    to_status: "hired",
    changed_by: actorId,
    reason: "Accepted from administrator review"
  });
  await admin.from("notifications").insert({
    recipient_id: invite.user.id,
    title: "Crestview staff access created",
    body: "Your recruitment application has been accepted. Use the secure access email to enter your workspace.",
    type: "workflow",
    metadata: { job_application_id: record.id }
  });
  const delivery = invite.delivery === "crestview" ? "Crestview-branded access email" : "Supabase Auth access email";
  return { ok: true, message: `${record.first_name} ${record.last_name} accepted and invited as ${roleName.replaceAll("_", " ")}. ${delivery} sent to ${invite.deliveredTo}.` };
}

export async function decideJobApplicationAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const role = String(formData.get("role") ?? "");
  const classroomId = String(formData.get("classroomId") ?? "");
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  if (decision === "accept") {
    const result = await createStaffFromApplication(applicationId, user.id, role, classroomId);
    revalidatePath("/admin/recruitment");
    revalidatePath("/admin/staff");
    revalidatePath("/teacher/classes");
    return result;
  }
  if (decision === "deny") {
    const admin = createAdminClient();
    const { error } = await admin.from("job_applications").update({ status: "rejected" }).eq("id", applicationId);
    if (!error) {
      await admin.from("job_application_status_history").insert({ job_application_id: applicationId, to_status: "rejected", changed_by: user.id, reason: "Denied from administrator review" });
    }
    revalidatePath("/admin/recruitment");
    return error ? { ok: false, message: "The application could not be denied." } : { ok: true, message: "Application denied." };
  }
  return { ok: false, message: "Choose accept or deny." };
}

export async function bulkDecideJobApplicationsAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin.from("job_applications").select("id").eq("status", "submitted").is("deleted_at", null).limit(50);
  const ids = ((data ?? []) as Array<{ id: string }>).map((item) => item.id);
  if (!ids.length) return { ok: false, message: "No submitted applications are waiting." };

  if (decision === "deny") {
    const { error } = await admin.from("job_applications").update({ status: "rejected" }).in("id", ids);
    revalidatePath("/admin/recruitment");
    return error ? { ok: false, message: "Applications could not be denied." } : { ok: true, message: `${ids.length} applications denied.` };
  }

  if (decision === "accept") {
    let accepted = 0;
    let failed = 0;
    for (const id of ids) {
      const result = await createStaffFromApplication(id, user.id);
      if (result.ok) accepted += 1;
      else failed += 1;
    }
    revalidatePath("/admin/recruitment");
    return { ok: failed === 0, message: `${accepted} accepted${failed ? `, ${failed} need manual review` : ""}.` };
  }
  return { ok: false, message: "Choose accept all or deny all." };
}
