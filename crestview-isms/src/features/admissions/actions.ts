"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { admissionSchema } from "@/lib/validations/admission.schema";
import type { Json } from "@/types/database.types";

function studentNumberFor(applicationId: string) {
  return `CIS-${new Date().getFullYear()}-${applicationId.slice(0, 6).toUpperCase()}`;
}

async function notifyAdministrators(title: string, body: string, metadata: Json) {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id,roles(name)").is("deleted_at", null).eq("is_active", true);
  const recipients = ((profiles ?? []) as unknown as Array<{ id: string; roles: { name: string } | { name: string }[] | null }>)
    .filter((profile) => {
      const role = Array.isArray(profile.roles) ? profile.roles[0]?.name : profile.roles?.name;
      return role === "super_admin" || role === "school_admin";
    })
    .map((profile) => profile.id);
  if (recipients.length) {
    await admin.from("notifications").insert(recipients.map((recipientId) => ({
      recipient_id: recipientId,
      title,
      body,
      type: "workflow",
      metadata
    })));
  }
}

export async function submitAdmissionAction(formData: FormData) {
  const values = {
    applicantFirstName: String(formData.get("applicantFirstName") ?? ""),
    applicantLastName: String(formData.get("applicantLastName") ?? ""),
    applyingGrade: String(formData.get("applyingGrade") ?? ""),
    guardianEmail: String(formData.get("guardianEmail") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    notes: String(formData.get("notes") ?? "")
  };

  const result = admissionSchema.safeParse(values);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Invalid application." };
  }

  const admin = createAdminClient();
  const { data: application, error } = await admin.from("admission_applications").insert({
    applicant_first_name: result.data.applicantFirstName.trim(),
    applicant_last_name: result.data.applicantLastName.trim(),
    applying_grade: result.data.applyingGrade.trim(),
    guardian_email: result.data.guardianEmail.trim().toLowerCase(),
    guardian_phone: result.data.guardianPhone.trim(),
    notes: result.data.notes?.trim() || null,
    source: "school_website",
    status: "submitted"
  }).select("id").single();

  const applicationRecord = application as { id: string } | null;
  if (error || !applicationRecord) return { ok: false, message: "We could not submit the application. Please call the school for assistance." };
  await notifyAdministrators(
    "New student application",
    `${result.data.applicantFirstName} ${result.data.applicantLastName} applied for ${result.data.applyingGrade}.`,
    { admission_application_id: applicationRecord.id, source: "school_website" }
  );
  revalidatePath("/admin/admissions");
  return { ok: true, message: "Application received. Our admissions team will contact you shortly." };
}

async function findProfileByEmail(email: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id,email").eq("email", email.toLowerCase()).maybeSingle();
  return data as { id: string; email: string } | null;
}

async function ensureParentAccount(application: {
  id: string;
  guardian_email: string;
  guardian_phone: string | null;
  applicant_last_name: string;
}) {
  const admin = createAdminClient();
  const email = application.guardian_email.toLowerCase();
  const existing = await findProfileByEmail(email);
  if (existing) return { ok: true as const, profileId: existing.id };

  const { data: role } = await admin.from("roles").select("id").eq("name", "parent").maybeSingle();
  if (!role) return { ok: false as const, message: "The parent role is not configured." };
  const { data: invite, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/reset-password`,
    data: { first_name: "Guardian", last_name: application.applicant_last_name, role: "parent", admission_application_id: application.id }
  });
  if (error || !invite.user) return { ok: false as const, message: "The guardian portal invitation could not be sent." };
  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: role.id,
    first_name: "Guardian",
    last_name: application.applicant_last_name,
    email,
    phone: application.guardian_phone,
    metadata: { account_source: "admission_acceptance", admission_application_id: application.id }
  });
  const { error: invitationError } = profileError ? { error: profileError } : await admin.from("portal_invitations").insert({
    email,
    role_id: role.id,
    first_name: "Guardian",
    last_name: application.applicant_last_name,
    auth_user_id: invite.user.id,
    metadata: { account_source: "admission_acceptance", admission_application_id: application.id }
  });
  if (profileError || invitationError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return { ok: false as const, message: "The guardian portal account could not be created." };
  }
  return { ok: true as const, profileId: invite.user.id };
}

async function acceptAdmission(applicationId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("admission_applications").select("*").eq("id", applicationId).maybeSingle();
  const application = data as {
    id: string;
    applicant_first_name: string;
    applicant_last_name: string;
    applying_grade: string;
    guardian_email: string;
    guardian_phone: string | null;
    status: string;
    previous_school: string | null;
  } | null;
  if (!application) return { ok: false, message: "The application no longer exists." };
  if (application.status === "accepted") return { ok: true, message: "This application has already been accepted." };

  const { data: studentRole } = await admin.from("roles").select("id").eq("name", "student").maybeSingle();
  if (!studentRole) return { ok: false, message: "The student role is not configured." };
  const { data: classroom } = await admin
    .from("classrooms")
    .select("id")
    .or(`grade_level.ilike.%${application.applying_grade}%,name.ilike.%${application.applying_grade}%`)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  const studentNumber = studentNumberFor(application.id);
  const studentEmail = `${studentNumber.toLowerCase()}@students.crestview.local`;
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email: studentEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: application.applicant_first_name,
      last_name: application.applicant_last_name,
      role: "student",
      admission_application_id: application.id
    }
  });
  if (accountError || !account.user) return { ok: false, message: "The student portal record could not be prepared." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: account.user.id,
    role_id: studentRole.id,
    first_name: application.applicant_first_name,
    last_name: application.applicant_last_name,
    email: studentEmail,
    metadata: {
      account_source: "admission_acceptance",
      admission_application_id: application.id,
      guardian_email: application.guardian_email
    }
  });
  const { data: studentData, error: studentError } = profileError ? { data: null, error: profileError } : await admin.from("students").insert({
    profile_id: account.user.id,
    student_number: studentNumber,
    classroom_id: classroom?.id ?? null,
    enrollment_date: new Date().toISOString().slice(0, 10),
    status: "active",
    admission_application_id: application.id,
    previous_school: application.previous_school,
    metadata: { applying_grade: application.applying_grade, guardian_email: application.guardian_email }
  }).select("id").single();
  const student = studentData as { id: string } | null;
  if (profileError || studentError || !student) {
    await admin.auth.admin.deleteUser(account.user.id);
    return { ok: false, message: "The student record could not be created." };
  }

  const parent = await ensureParentAccount(application);
  if (!parent.ok) {
    await admin.auth.admin.deleteUser(account.user.id);
    return { ok: false, message: parent.message };
  }
  await admin.from("parent_students").upsert({
    parent_profile_id: parent.profileId,
    student_id: student.id,
    relationship: "guardian"
  }, { onConflict: "parent_profile_id,student_id" });
  await admin.from("admission_applications").update({
    status: "accepted",
    decision_at: new Date().toISOString(),
    assigned_to: account.user.id
  }).eq("id", application.id);
  await admin.from("admission_status_history").insert({
    application_id: application.id,
    to_status: "accepted",
    reason: "Accepted from administrator review"
  });
  await admin.from("notifications").insert([
    {
      recipient_id: parent.profileId,
      title: "Admission accepted",
      body: `${application.applicant_first_name}'s Crestview admission has been accepted. Use the secure access email to enter the parent workspace.`,
      type: "workflow",
      metadata: { admission_application_id: application.id, student_id: student.id }
    },
    {
      recipient_id: account.user.id,
      title: "Student profile created",
      body: "Your Crestview student record has been created from the admission application.",
      type: "workflow",
      metadata: { admission_application_id: application.id, student_id: student.id }
    }
  ]);
  return { ok: true, message: `${application.applicant_first_name} ${application.applicant_last_name} accepted as ${studentNumber}.` };
}

export async function decideAdmissionApplicationAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  await requireRoles(["super_admin", "school_admin"]);
  if (decision === "accept") {
    const result = await acceptAdmission(applicationId);
    revalidatePath("/admin/admissions");
    revalidatePath("/admin/students");
    return result;
  }
  if (decision === "deny") {
    const admin = createAdminClient();
    const { error } = await admin.from("admission_applications").update({
      status: "rejected",
      decision_at: new Date().toISOString()
    }).eq("id", applicationId);
    if (!error) {
      await admin.from("admission_status_history").insert({ application_id: applicationId, to_status: "rejected", reason: "Denied from administrator review" });
    }
    revalidatePath("/admin/admissions");
    return error ? { ok: false, message: "The application could not be denied." } : { ok: true, message: "Application denied." };
  }
  return { ok: false, message: "Choose accept or deny." };
}

export async function bulkDecideAdmissionApplicationsAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin.from("admission_applications").select("id").eq("status", "submitted").is("deleted_at", null).limit(50);
  const ids = ((data ?? []) as Array<{ id: string }>).map((item) => item.id);
  if (!ids.length) return { ok: false, message: "No submitted applications are waiting." };

  if (decision === "deny") {
    const { error } = await admin.from("admission_applications").update({ status: "rejected", decision_at: new Date().toISOString() }).in("id", ids);
    revalidatePath("/admin/admissions");
    return error ? { ok: false, message: "Applications could not be denied." } : { ok: true, message: `${ids.length} applications denied.` };
  }

  if (decision === "accept") {
    let accepted = 0;
    let failed = 0;
    for (const id of ids) {
      const result = await acceptAdmission(id);
      if (result.ok) accepted += 1;
      else failed += 1;
    }
    revalidatePath("/admin/admissions");
    revalidatePath("/admin/students");
    return { ok: failed === 0, message: `${accepted} accepted${failed ? `, ${failed} need manual review` : ""}.` };
  }
  return { ok: false, message: "Choose accept all or deny all." };
}
