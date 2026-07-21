"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRoles } from "@/features/auth/guards";
import { createWorkflowTask } from "@/features/automation/actions";
import { APP_URL } from "@/lib/constants";
import { createPortalInvitation } from "@/lib/email/portal-access";
import { generateStudentNumber } from "@/lib/students/student-number";
import { createAdminClient } from "@/lib/supabase/admin";
import { admissionSchema } from "@/lib/validations/admission.schema";
import type { Json } from "@/types/database.types";

function internalPlaceholderPassword() {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Guardian",
    lastName: parts.slice(1).join(" ") || "Guardian"
  };
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
    applicantFirstName: formString(formData, "applicantFirstName"),
    applicantMiddleName: formString(formData, "applicantMiddleName"),
    applicantLastName: formString(formData, "applicantLastName"),
    applicantDateOfBirth: formString(formData, "applicantDateOfBirth"),
    applyingGrade: formString(formData, "applyingGrade"),
    applicantGender: formString(formData, "applicantGender"),
    homeAddress: formString(formData, "homeAddress"),
    city: formString(formData, "city"),
    zipCode: formString(formData, "zipCode"),
    previousSchool: formString(formData, "previousSchool"),
    fatherName: formString(formData, "fatherName"),
    fatherPhone: formString(formData, "fatherPhone"),
    fatherEmail: formString(formData, "fatherEmail"),
    fatherAddress: formString(formData, "fatherAddress"),
    fatherOccupation: formString(formData, "fatherOccupation"),
    fatherLocation: formString(formData, "fatherLocation"),
    motherName: formString(formData, "motherName"),
    motherPhone: formString(formData, "motherPhone"),
    motherEmail: formString(formData, "motherEmail"),
    motherAddress: formString(formData, "motherAddress"),
    motherOccupation: formString(formData, "motherOccupation"),
    motherLocation: formString(formData, "motherLocation"),
    guardianName: formString(formData, "guardianName"),
    guardianPhone: formString(formData, "guardianPhone"),
    guardianEmail: formString(formData, "guardianEmail"),
    guardianAddress: formString(formData, "guardianAddress"),
    guardianRelationship: formString(formData, "guardianRelationship"),
    guardianRelationshipOther: formString(formData, "guardianRelationshipOther"),
    emergencyContactName: formString(formData, "emergencyContactName"),
    emergencyContactRelationship: formString(formData, "emergencyContactRelationship"),
    emergencyContactPhone: formString(formData, "emergencyContactPhone"),
    primaryPhysicianName: formString(formData, "primaryPhysicianName"),
    primaryPhysicianPhone: formString(formData, "primaryPhysicianPhone"),
    healthInsuranceNumber: formString(formData, "healthInsuranceNumber"),
    hasAllergies: formString(formData, "hasAllergies"),
    allergiesDetails: formString(formData, "allergiesDetails"),
    hasMedicalConditions: formString(formData, "hasMedicalConditions"),
    medicalConditionsDetails: formString(formData, "medicalConditionsDetails"),
    submittedBirthCertificate: formString(formData, "submittedBirthCertificate"),
    submittedProofOfAddress: formString(formData, "submittedProofOfAddress"),
    submittedNhis: formString(formData, "submittedNhis"),
    certifyAccuracy: formString(formData, "certifyAccuracy"),
    consentEmergencyTreatment: formString(formData, "consentEmergencyTreatment"),
    acknowledgeNoGuarantee: formString(formData, "acknowledgeNoGuarantee"),
    notes: formString(formData, "notes")
  };

  const result = admissionSchema.safeParse(values);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Invalid application." };
  }

  const admin = createAdminClient();
  const primaryGuardian = splitFullName(result.data.guardianName);
  const guardianRows = [
    result.data.fatherName ? {
      first_name: splitFullName(result.data.fatherName).firstName,
      last_name: splitFullName(result.data.fatherName).lastName,
      relationship: "father",
      email: result.data.fatherEmail ?? null,
      phone: result.data.fatherPhone ?? null,
      occupation: result.data.fatherOccupation ?? null,
      address: {
        address: result.data.fatherAddress ?? null,
        location: result.data.fatherLocation ?? null
      } satisfies Json,
      is_primary: result.data.guardianRelationship.toLowerCase() === "father"
    } : null,
    result.data.motherName ? {
      first_name: splitFullName(result.data.motherName).firstName,
      last_name: splitFullName(result.data.motherName).lastName,
      relationship: "mother",
      email: result.data.motherEmail ?? null,
      phone: result.data.motherPhone ?? null,
      occupation: result.data.motherOccupation ?? null,
      address: {
        address: result.data.motherAddress ?? null,
        location: result.data.motherLocation ?? null
      } satisfies Json,
      is_primary: result.data.guardianRelationship.toLowerCase() === "mother"
    } : null,
    {
      first_name: primaryGuardian.firstName,
      last_name: primaryGuardian.lastName,
      relationship: result.data.guardianRelationship === "Other" && result.data.guardianRelationshipOther ? result.data.guardianRelationshipOther : result.data.guardianRelationship,
      email: result.data.guardianEmail.trim().toLowerCase(),
      phone: result.data.guardianPhone.trim(),
      occupation: null,
      address: {
        address: result.data.guardianAddress ?? null
      } satisfies Json,
      is_primary: true
    }
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const metadata = {
    source_form: "crestview_admission_form_pdf_v1",
    emergency_contact: {
      name: result.data.emergencyContactName,
      relationship: result.data.emergencyContactRelationship,
      phone: result.data.emergencyContactPhone
    },
    health: {
      has_allergies: result.data.hasAllergies === "yes",
      allergies_details: result.data.allergiesDetails ?? null,
      has_medical_conditions: result.data.hasMedicalConditions === "yes",
      medical_conditions_details: result.data.medicalConditionsDetails ?? null,
      primary_physician_name: result.data.primaryPhysicianName ?? null,
      primary_physician_phone: result.data.primaryPhysicianPhone ?? null,
      health_insurance_number: result.data.healthInsuranceNumber ?? null
    },
    documents_submitted: {
      birth_certificate: result.data.submittedBirthCertificate,
      proof_of_address: result.data.submittedProofOfAddress,
      nhis: result.data.submittedNhis
    },
    declarations: {
      certified_accurate: result.data.certifyAccuracy,
      emergency_treatment_consent: result.data.consentEmergencyTreatment,
      no_admission_guarantee_acknowledged: result.data.acknowledgeNoGuarantee,
      signed_at: new Date().toISOString()
    }
  } satisfies Json;
  const { data: application, error } = await admin.from("admission_applications").insert({
    applicant_first_name: result.data.applicantFirstName.trim(),
    applicant_middle_name: result.data.applicantMiddleName ?? null,
    applicant_last_name: result.data.applicantLastName.trim(),
    applicant_date_of_birth: result.data.applicantDateOfBirth,
    applicant_gender: result.data.applicantGender,
    applying_grade: result.data.applyingGrade.trim(),
    guardian_email: result.data.guardianEmail.trim().toLowerCase(),
    guardian_phone: result.data.guardianPhone.trim(),
    previous_school: result.data.previousSchool ?? null,
    applicant_address: {
      home_address: result.data.homeAddress,
      city: result.data.city,
      zip_code: result.data.zipCode ?? null
    } satisfies Json,
    notes: result.data.notes?.trim() || null,
    source: "school_website",
    status: "submitted",
    metadata
  }).select("id").single();

  const applicationRecord = application as { id: string } | null;
  if (error || !applicationRecord) return { ok: false, message: "We could not submit the application. Please call the school for assistance." };
  const guardiansWithApplication = guardianRows.map((row) => ({ ...row, application_id: applicationRecord.id }));
  const documents = [
    result.data.submittedBirthCertificate ? "birth_certificate" : null,
    result.data.submittedProofOfAddress ? "proof_of_address" : null,
    result.data.submittedNhis ? "nhis" : null
  ].filter((documentType): documentType is string => Boolean(documentType));
  const { error: guardianError } = await admin.from("admission_guardians").insert(guardiansWithApplication);
  const { error: documentError } = documents.length
    ? await admin.from("admission_documents").insert(documents.map((documentType) => ({
        application_id: applicationRecord.id,
        document_type: documentType,
        status: "pending",
        notes: "Marked as submitted on the public admission form."
      })))
    : { error: null };
  if (guardianError || documentError) {
    await admin.from("admission_applications").delete().eq("id", applicationRecord.id);
    return { ok: false, message: "We could not save the full application. Please call the school for assistance." };
  }
  await admin.from("admission_status_history").insert({
    application_id: applicationRecord.id,
    to_status: "submitted",
    reason: "Submitted from the public admission form"
  });
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
}, actorId: string) {
  const admin = createAdminClient();
  const email = application.guardian_email.toLowerCase();
  const existing = await findProfileByEmail(email);
  if (existing) return { ok: true as const, profileId: existing.id, created: false, accessEmailSent: false };

  const { data: role } = await admin.from("roles").select("id").eq("name", "parent").maybeSingle();
  if (!role) return { ok: false as const, message: "The parent role is not configured." };
  const { data: primaryGuardian } = await admin
    .from("admission_guardians")
    .select("first_name,last_name,phone")
    .eq("application_id", application.id)
    .eq("is_primary", true)
    .maybeSingle();
  const guardian = primaryGuardian as { first_name: string; last_name: string; phone: string | null } | null;
  const firstName = guardian?.first_name ?? "Guardian";
  const lastName = guardian?.last_name ?? application.applicant_last_name;
  const account = await createPortalInvitation({
    admin,
    email,
    firstName,
    lastName,
    role: "parent",
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { first_name: firstName, last_name: lastName, role: "parent", admission_application_id: application.id, account_source: "admission_acceptance" }
  });
  if (!account.ok) return { ok: false as const, message: account.message };
  const { error: profileError } = await admin.from("profiles").insert({
    id: account.user.id,
    role_id: role.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: guardian?.phone ?? application.guardian_phone,
    is_active: true,
    metadata: { account_source: "admission_acceptance", admission_application_id: application.id, password_set_by_user: true }
  });
  const { error: invitationError } = profileError ? { error: profileError } : await admin.from("portal_invitations").insert({
    email,
    role_id: role.id,
    first_name: firstName,
    last_name: lastName,
    invited_by: actorId,
    auth_user_id: account.user.id,
    status: "invited",
    metadata: {
      account_source: "admission_acceptance",
      admission_application_id: application.id,
      password_set_by_user: true
    }
  });
  if (profileError || invitationError) {
    await admin.auth.admin.deleteUser(account.user.id);
    return { ok: false as const, message: "The guardian portal invitation could not be recorded." };
  }
  await admin.from("account_lifecycle_records").insert({
    profile_id: account.user.id,
    action: "created",
    reason: "Parent account invited after accepted admission",
    performed_by: actorId,
    snapshot: { admission_application_id: application.id, access_method: "secure_invite_link", delivery: account.delivery, delivered_to: account.deliveredTo }
  });
  return { ok: true as const, profileId: account.user.id, created: true, accessEmailSent: true, delivery: account.delivery, deliveredTo: account.deliveredTo };
}

async function acceptAdmission(applicationId: string, actorId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("admission_applications").select("*").eq("id", applicationId).maybeSingle();
  const application = data as {
    id: string;
    applicant_first_name: string;
    applicant_middle_name: string | null;
    applicant_last_name: string;
    applicant_date_of_birth: string | null;
    applicant_gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
    applying_grade: string;
    guardian_email: string;
    guardian_phone: string | null;
    status: string;
    previous_school: string | null;
    applicant_address: Json | null;
    metadata: Json | null;
    accepted_student_id: string | null;
    parent_profile_id: string | null;
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
  const classroomRecord = classroom as { id: string } | null;

  const studentNumber = await generateStudentNumber(admin);
  const studentEmail = `${studentNumber.toLowerCase()}@students.crestview.local`;
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email: studentEmail,
    password: internalPlaceholderPassword(),
    email_confirm: true,
    user_metadata: {
      first_name: application.applicant_first_name,
      middle_name: application.applicant_middle_name,
      last_name: application.applicant_last_name,
      role: "student",
      student_number: studentNumber,
      admission_application_id: application.id
    }
  });
  if (accountError || !account.user) return { ok: false, message: "The student portal record could not be prepared." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: account.user.id,
    role_id: studentRole.id,
    first_name: application.applicant_first_name,
    middle_name: application.applicant_middle_name,
    last_name: application.applicant_last_name,
    email: studentEmail,
    date_of_birth: application.applicant_date_of_birth,
    gender: application.applicant_gender,
    address: application.applicant_address,
    emergency_contact: application.metadata && typeof application.metadata === "object" && !Array.isArray(application.metadata) ? application.metadata.emergency_contact as Json : null,
    is_active: false,
    metadata: {
      account_source: "admission_acceptance",
      admission_application_id: application.id,
      guardian_email: application.guardian_email,
      student_access_pending: true,
      activation_method: "class_teacher_or_admin_secure_access"
    }
  });
  const { data: studentData, error: studentError } = profileError ? { data: null, error: profileError } : await admin.from("students").insert({
    profile_id: account.user.id,
    student_number: studentNumber,
    classroom_id: classroomRecord?.id ?? null,
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

  const parent = await ensureParentAccount(application, actorId);
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
    assigned_to: actorId,
    accepted_student_id: student.id,
    parent_profile_id: parent.profileId,
    generated_student_number: studentNumber,
    onboarding_notes: parent.accessEmailSent
      ? "Parent secure access email sent. Student portal is pending teacher roster activation."
      : "Existing parent account linked. Student portal is pending teacher roster activation."
  }).eq("id", application.id);
  await createWorkflowTask({
    title: `Complete onboarding for ${application.applicant_first_name} ${application.applicant_last_name}`,
    workflowKey: "admissions_onboarding",
    description: "Verify parent access, confirm class placement, check required documents, and prepare the first invoice.",
    priority: "high",
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: actorId,
    studentId: student.id,
    parentProfileId: parent.profileId,
    classroomId: classroomRecord?.id ?? null,
    relatedTable: "admission_applications",
    relatedRecordId: application.id,
    metadata: {
      admission_application_id: application.id,
      student_number: studentNumber,
      parent_account_created: parent.created,
      source: "admission_acceptance"
    }
  });
  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "admission.accepted");
  await admin.from("admission_status_history").insert({
    application_id: application.id,
    to_status: "accepted",
    changed_by: actorId,
    reason: "Accepted from administrator review"
  });
  await admin.from("account_lifecycle_records").insert({
    profile_id: account.user.id,
    student_id: student.id,
    action: "created",
    reason: "Student record created from accepted admission; portal access pending class teacher activation",
    performed_by: actorId,
    snapshot: { admission_application_id: application.id, student_number: studentNumber, classroom_id: classroomRecord?.id ?? null }
  });
  await admin.from("notifications").insert([
    {
      recipient_id: parent.profileId,
      title: "Admission accepted",
      body: parent.accessEmailSent
        ? `${application.applicant_first_name}'s Crestview admission has been accepted. Open the secure access email to choose your password and enter the parent workspace.`
        : `${application.applicant_first_name}'s Crestview admission has been accepted and linked to your parent workspace.`,
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
  const accessLine = parent.accessEmailSent
    ? ` Secure parent access email sent to ${application.guardian_email.toLowerCase()}.`
    : ` Parent account already exists for ${application.guardian_email.toLowerCase()}.`;
  return {
    ok: true,
    message: `${application.applicant_first_name} ${application.applicant_last_name} accepted as ${studentNumber}.${accessLine} Student portal is prepared and inactive until the class teacher activates it.`
  };
}

export async function decideAdmissionApplicationAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const { user } = await requireRoles(["super_admin", "school_admin"]);
  if (decision === "accept") {
    const result = await acceptAdmission(applicationId, user.id);
    revalidatePath("/admin/admissions");
    revalidatePath("/admin/students");
    revalidatePath("/parent");
    return result;
  }
  if (decision === "deny") {
    const admin = createAdminClient();
    const { error } = await admin.from("admission_applications").update({
      status: "rejected",
      decision_at: new Date().toISOString()
    }).eq("id", applicationId);
    if (!error) {
      await admin.from("admission_status_history").insert({ application_id: applicationId, to_status: "rejected", changed_by: user.id, reason: "Denied from administrator review" });
    }
    revalidatePath("/admin/admissions");
    return error ? { ok: false, message: "The application could not be denied." } : { ok: true, message: "Application denied." };
  }
  return { ok: false, message: "Choose accept or deny." };
}

export async function bulkDecideAdmissionApplicationsAction(formData: FormData) {
  const decision = String(formData.get("decision") ?? "");
  const { user } = await requireRoles(["super_admin", "school_admin"]);
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
      const result = await acceptAdmission(id, user.id);
      if (result.ok) accepted += 1;
      else failed += 1;
    }
    revalidatePath("/admin/admissions");
    revalidatePath("/admin/students");
    return { ok: failed === 0, message: `${accepted} accepted${failed ? `, ${failed} need manual review` : ""}.` };
  }
  return { ok: false, message: "Choose accept all or deny all." };
}
