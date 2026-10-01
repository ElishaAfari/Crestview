"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { isPrimaryAdminRole } from "@/config/roles";
import {
  createPortalInvitation,
  portalAccessExpiresAt,
  sendPortalAccessEmail,
} from "@/lib/email/portal-access";
import { consumeAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateStaffNumber,
  isSupportedStaffNumber,
  normalizeStaffNumber,
} from "@/lib/staff/staff-number";
import { staffSchema } from "@/lib/validations/staff.schema";

type AssignedClassroom = {
  id: string;
  academic_year_id: string | null;
};

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error("The existing account could not be checked.");
    const match = data.users.find(
      (account) => account.email?.trim().toLowerCase() === email,
    );
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
  throw new Error("The account directory is too large to search safely.");
}

async function assignTeacherClassroom(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  classroom: AssignedClassroom,
  assignedBy: string,
) {
  const { error: classAssignmentError } = await admin
    .from("staff_class_assignments")
    .upsert(
      {
        profile_id: profileId,
        classroom_id: classroom.id,
        academic_year_id: classroom.academic_year_id,
        assignment_type: "class_teacher",
        status: "active",
        assigned_by: assignedBy,
      },
      {
        onConflict: "profile_id,classroom_id,academic_year_id,assignment_type",
      },
    );
  if (classAssignmentError)
    return "The teacher account was saved, but the class assignment could not be saved.";

  const { data: coursesData } = await admin
    .from("courses")
    .select("id,teacher_id")
    .eq("classroom_id", classroom.id)
    .is("deleted_at", null);
  const courses = (coursesData ?? []) as Array<{
    id: string;
    teacher_id: string | null;
  }>;
  if (!courses.length) return null;

  await admin.from("teacher_assignments").upsert(
    courses.map((course) => ({
      teacher_id: profileId,
      course_id: course.id,
      role: "class_teacher",
    })),
    { onConflict: "teacher_id,course_id" },
  );
  const unassignedCourseIds = courses
    .filter((course) => !course.teacher_id)
    .map((course) => course.id);
  if (unassignedCourseIds.length)
    await admin
      .from("courses")
      .update({ teacher_id: profileId })
      .in("id", unassignedCourseIds);
  return null;
}

export async function createStaffAction(formData: FormData) {
  const result = staffSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
    staffNumber: String(formData.get("staffNumber") ?? "") || undefined,
    jobTitle: String(formData.get("jobTitle") ?? "") || undefined,
    classroomId: String(formData.get("classroomId") ?? "") || undefined,
    employmentType: String(formData.get("employmentType") ?? "full_time"),
    role: String(formData.get("role") ?? ""),
  });
  if (!result.success)
    return {
      ok: false,
      message: result.error.issues[0]?.message ?? "Check the staff details.",
    };

  const { user } = await requireRoles([
    "super_admin",
    "school_admin",
    "hr_staff",
  ]);
  const admin = createAdminClient();
  let assignedClassroom: AssignedClassroom | null = null;
  if (result.data.role === "teacher" && result.data.classroomId) {
    const { data: classroomData } = await admin
      .from("classrooms")
      .select("id,academic_year_id")
      .eq("id", result.data.classroomId)
      .is("deleted_at", null)
      .maybeSingle();
    assignedClassroom = classroomData as AssignedClassroom | null;
    if (!assignedClassroom)
      return {
        ok: false,
        message: "Choose a valid class before creating the teacher account.",
      };
  }
  const email = result.data.email.trim().toLowerCase();
  const { data: staffRole } = await admin
    .from("roles")
    .select("id")
    .eq("name", result.data.role)
    .single();
  if (!staffRole)
    return { ok: false, message: "The selected staff role is not configured." };

  try {
    const allowed = await consumeAuthRateLimit({
      action: "staff_invite",
      identifier: `${user.id}:${email}`,
      limit: 25,
      windowMs: 60 * 60 * 1000,
    });
    if (!allowed)
      return {
        ok: false,
        message:
          "The staff invitation limit has been reached. Try again in an hour.",
      };
  } catch {
    return {
      ok: false,
      message:
        "Staff invitations are temporarily unavailable. Please try again shortly.",
    };
  }

  const suppliedStaffNumber = normalizeStaffNumber(
    result.data.staffNumber?.trim() ?? "",
  );
  if (suppliedStaffNumber && !isSupportedStaffNumber(suppliedStaffNumber))
    return {
      ok: false,
      message:
        "Use a staff ID in the format CIS/STA0001 or leave it blank for automatic generation.",
    };

  const { data: existingProfileData } = await admin
    .from("profiles")
    .select("id,is_active,deleted_at")
    .eq("email", email)
    .maybeSingle();
  const existingProfile = existingProfileData as {
    id: string;
    is_active: boolean | null;
    deleted_at: string | null;
  } | null;

  let existingAuthUser: Awaited<ReturnType<typeof findAuthUserByEmail>>;
  try {
    existingAuthUser = await findAuthUserByEmail(admin, email);
  } catch {
    return {
      ok: false,
      message:
        "The existing account could not be checked. Please try again shortly.",
    };
  }
  const existingAccountId = existingProfile?.id ?? existingAuthUser?.id ?? null;

  if (existingProfile?.is_active && !existingProfile.deleted_at)
    return {
      ok: false,
      message:
        "This email already has an active portal account. Use User Management to resend a fresh access link instead.",
    };

  if (existingAccountId) {
    const { data: authAccount } =
      await admin.auth.admin.getUserById(existingAccountId);
    const { error: authError } = await admin.auth.admin.updateUserById(
      existingAccountId,
      {
        ban_duration: "none",
        email_confirm: true,
        user_metadata: {
          ...(authAccount.user?.user_metadata ?? {}),
          first_name: result.data.firstName.trim(),
          last_name: result.data.lastName.trim(),
          role: result.data.role,
        },
      },
    );
    if (authError)
      return {
        ok: false,
        message: "The existing staff account could not be restored.",
      };

    const profileValues = {
      role_id: staffRole.id,
      first_name: result.data.firstName.trim(),
      last_name: result.data.lastName.trim(),
      email,
      phone: result.data.phone?.trim() || null,
      is_active: true,
      deleted_at: null,
      onboarding_completed_at: null,
      metadata: { account_source: "staff_account_recovered" },
    };
    const { error: profileError } = existingProfile
      ? await admin
          .from("profiles")
          .update(profileValues)
          .eq("id", existingAccountId)
      : await admin.from("profiles").insert({
          id: existingAccountId,
          ...profileValues,
        });
    if (profileError)
      return {
        ok: false,
        message: "The existing staff profile could not be restored.",
      };

    const { data: existingStaffData } = await admin
      .from("staff_profiles")
      .select("id,staff_number")
      .eq("profile_id", existingAccountId)
      .maybeSingle();
    const existingStaff = existingStaffData as {
      id: string;
      staff_number: string;
    } | null;
    const staffNumber =
      existingStaff?.staff_number ??
      suppliedStaffNumber ??
      (await generateStaffNumber(admin));
    const { error: staffProfileError } = existingStaff
      ? await admin
          .from("staff_profiles")
          .update({
            job_title:
              result.data.jobTitle?.trim() ||
              result.data.role.replaceAll("_", " "),
            employment_type: result.data.employmentType,
            deleted_at: null,
            metadata: { role: result.data.role },
          })
          .eq("id", existingStaff.id)
      : await admin.from("staff_profiles").insert({
          profile_id: existingAccountId,
          staff_number: staffNumber,
          job_title:
            result.data.jobTitle?.trim() ||
            result.data.role.replaceAll("_", " "),
          employment_type: result.data.employmentType,
          hire_date: new Date().toISOString().slice(0, 10),
          metadata: { role: result.data.role },
        });
    if (staffProfileError)
      return { ok: false, message: "The staff record could not be restored." };

    if (result.data.role === "teacher" && assignedClassroom) {
      const assignmentError = await assignTeacherClassroom(
        admin,
        existingAccountId,
        assignedClassroom,
        user.id,
      );
      if (assignmentError) return { ok: false, message: assignmentError };
    }

    const access = await sendPortalAccessEmail({
      admin,
      authEmail: email,
      firstName: result.data.firstName.trim(),
      lastName: result.data.lastName.trim(),
      role: result.data.role,
      redirectTo: `${APP_URL}/reset-password`,
    });
    if (!access.ok)
      return {
        ok: false,
        message:
          "The staff account was restored, but the access email could not be sent. Open User Management and use Resend access.",
      };

    const expiresAt = portalAccessExpiresAt();
    const { data: priorInvitation } = await admin
      .from("portal_invitations")
      .select("id")
      .eq("auth_user_id", existingAccountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (priorInvitation?.id) {
      await admin
        .from("portal_invitations")
        .update({ status: "invited", expires_at: expiresAt, deleted_at: null })
        .eq("id", priorInvitation.id);
    } else {
      await admin.from("portal_invitations").insert({
        email,
        first_name: result.data.firstName.trim(),
        last_name: result.data.lastName.trim(),
        role_id: staffRole.id,
        invited_by: user.id,
        auth_user_id: existingAccountId,
        expires_at: expiresAt,
        metadata: { account_source: "staff_account_restored" },
      });
    }

    revalidatePath("/admin/staff");
    revalidatePath("/admin/access");
    return {
      ok: true,
      message: `Existing staff account restored with staff number ${staffNumber}. A fresh access link was sent to ${access.deliveredTo}.`,
    };
  }

  const invite = await createPortalInvitation({
    admin,
    email,
    firstName: result.data.firstName.trim(),
    lastName: result.data.lastName.trim(),
    role: result.data.role,
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { account_source: "manual_staff_create" },
    allowLinkFallback: true,
  });
  if (!invite.ok) return { ok: false, message: invite.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invite.user.id,
    role_id: staffRole.id,
    first_name: result.data.firstName.trim(),
    last_name: result.data.lastName.trim(),
    email,
    phone: result.data.phone?.trim() || null,
  });
  const staffNumber = suppliedStaffNumber || (await generateStaffNumber(admin));
  const { error: staffProfileError } = profileError
    ? { error: profileError }
    : await admin.from("staff_profiles").insert({
        profile_id: invite.user.id,
        staff_number: staffNumber,
        job_title:
          result.data.jobTitle?.trim() || result.data.role.replaceAll("_", " "),
        employment_type: result.data.employmentType,
        hire_date: new Date().toISOString().slice(0, 10),
        metadata: { role: result.data.role },
      });

  if (profileError || staffProfileError) {
    await admin.auth.admin.deleteUser(invite.user.id);
    return {
      ok: false,
      message:
        "The staff profile could not be created. Check the staff number and role.",
    };
  }

  if (result.data.role === "teacher" && assignedClassroom) {
    const assignmentError = await assignTeacherClassroom(
      admin,
      invite.user.id,
      assignedClassroom,
      user.id,
    );
    if (assignmentError) return { ok: false, message: assignmentError };
  }

  const { error: invitationRecordError } = await admin
    .from("portal_invitations")
    .insert({
      email,
      first_name: result.data.firstName.trim(),
      last_name: result.data.lastName.trim(),
      role_id: staffRole.id,
      invited_by: user.id,
      auth_user_id: invite.user.id,
      expires_at: portalAccessExpiresAt(),
      metadata: { account_source: "manual_staff_create" },
    });
  if (invitationRecordError)
    return {
      ok: false,
      message:
        "The staff account was created, but its access record could not be saved. Open User Management and resend access.",
    };

  const delivery =
    invite.delivery === "crestview"
      ? "Crestview-branded access email"
      : invite.delivery === "supabase_auth_link"
        ? "secure one-time access link generated because email delivery is temporarily unavailable"
        : "Supabase Auth access email";
  const deliveryMessage =
    invite.delivery === "supabase_auth_link"
      ? `${delivery}.`
      : `${delivery} sent to ${invite.deliveredTo}.`;
  return {
    ok: true,
    message: `Staff member invited with staff number ${staffNumber}.${result.data.role === "teacher" && result.data.classroomId ? " Class and course access assigned." : ""} ${deliveryMessage}`,
    accessLink: invite.accessLink,
  };
}

export async function deactivateStaffAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(
    formData.get("reason") ?? "No longer belongs to the institution",
  ).trim();
  const { user, role: currentRole } = await requireRoles([
    "super_admin",
    "school_admin",
  ]);
  if (profileId === user.id)
    return {
      ok: false,
      message: "You cannot deactivate your own administrator account.",
    };

  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from("profiles")
    .select("id,email,roles(name)")
    .eq("id", profileId)
    .maybeSingle();
  const profile = profileData as unknown as {
    id: string;
    email: string;
    roles: { name: string } | { name: string }[] | null;
  } | null;
  const targetRole = Array.isArray(profile?.roles)
    ? profile?.roles[0]?.name
    : profile?.roles?.name;
  if (!profile)
    return { ok: false, message: "The staff profile could not be found." };
  if (
    !isPrimaryAdminRole(currentRole) &&
    (targetRole === "super_admin" ||
      targetRole === "school_owner" ||
      targetRole === "school_admin")
  ) {
    return {
      ok: false,
      message:
        "Only the head administrator can deactivate administrator accounts.",
    };
  }

  await admin.auth.admin.updateUserById(profile.id, {
    ban_duration: "876000h",
  });
  const { error } = await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", profile.id);
  if (!error) {
    await admin
      .from("staff_class_assignments")
      .update({
        status: "ended",
        ends_on: new Date().toISOString().slice(0, 10),
      })
      .eq("profile_id", profile.id)
      .eq("status", "active");
    const { data: staffProfile } = await admin
      .from("staff_profiles")
      .select("id,staff_number,job_title")
      .eq("profile_id", profile.id)
      .maybeSingle();
    await admin.from("account_lifecycle_records").insert({
      profile_id: profile.id,
      staff_profile_id: (staffProfile as { id: string } | null)?.id ?? null,
      action: "archived",
      reason,
      performed_by: user.id,
      snapshot: {
        email: profile.email,
        role: targetRole,
        staff_profile: staffProfile,
      },
    });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/access");
  return error
    ? { ok: false, message: "The staff account could not be deactivated." }
    : {
        ok: true,
        message: "Staff portal access disabled and record archived.",
      };
}
