"use server";

import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { isPrimaryAdminRole } from "@/config/roles";
import { createPortalInvitation } from "@/lib/email/portal-access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateStaffNumber,
  isSupportedStaffNumber,
  normalizeStaffNumber,
} from "@/lib/staff/staff-number";
import { staffSchema } from "@/lib/validations/staff.schema";

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
  let assignedClassroom: {
    id: string;
    academic_year_id: string | null;
  } | null = null;
  if (result.data.role === "teacher" && result.data.classroomId) {
    const { data: classroomData } = await admin
      .from("classrooms")
      .select("id,academic_year_id")
      .eq("id", result.data.classroomId)
      .is("deleted_at", null)
      .maybeSingle();
    assignedClassroom = classroomData as {
      id: string;
      academic_year_id: string | null;
    } | null;
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

  const invite = await createPortalInvitation({
    admin,
    email,
    firstName: result.data.firstName.trim(),
    lastName: result.data.lastName.trim(),
    role: result.data.role,
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { account_source: "manual_staff_create" },
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
  const suppliedStaffNumber = normalizeStaffNumber(
    result.data.staffNumber?.trim() ?? "",
  );
  const staffNumber = suppliedStaffNumber || (await generateStaffNumber(admin));
  if (!isSupportedStaffNumber(staffNumber))
    return {
      ok: false,
      message:
        "Use a staff ID in the format CIS/STA0001 or leave it blank for automatic generation.",
    };
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
    const { error: classAssignmentError } = await admin
      .from("staff_class_assignments")
      .upsert(
        {
          profile_id: invite.user.id,
          classroom_id: assignedClassroom.id,
          academic_year_id: assignedClassroom.academic_year_id,
          assignment_type: "class_teacher",
          status: "active",
          assigned_by: user.id,
        },
        {
          onConflict:
            "profile_id,classroom_id,academic_year_id,assignment_type",
        },
      );
    if (classAssignmentError)
      return {
        ok: false,
        message:
          "The teacher account was created, but the class assignment could not be saved.",
      };

    const { data: coursesData } = await admin
      .from("courses")
      .select("id,teacher_id")
      .eq("classroom_id", assignedClassroom.id)
      .is("deleted_at", null);
    const courses = (coursesData ?? []) as Array<{
      id: string;
      teacher_id: string | null;
    }>;
    if (courses.length) {
      await admin.from("teacher_assignments").upsert(
        courses.map((course) => ({
          teacher_id: invite.user.id,
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
          .update({ teacher_id: invite.user.id })
          .in("id", unassignedCourseIds);
    }
  }

  const delivery =
    invite.delivery === "crestview"
      ? "Crestview-branded access email"
      : "Supabase Auth access email";
  return {
    ok: true,
    message: `Staff member invited with staff number ${staffNumber}.${result.data.role === "teacher" && result.data.classroomId ? " Class and course access assigned." : ""} ${delivery} sent to ${invite.deliveredTo}.`,
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
