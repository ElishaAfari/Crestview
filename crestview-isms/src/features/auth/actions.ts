"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPortalInvitation,
  sendPortalAccessEmail,
} from "@/lib/email/portal-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isSupportedStaffNumber,
  normalizeStaffNumber,
} from "@/lib/staff/staff-number";
import {
  isSupportedStudentNumber,
  normalizeStudentNumber,
} from "@/lib/students/student-number";
import type { Json } from "@/types/database.types";
import {
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth.schema";

export type SignInState = { ok: boolean; message: string };

const parentAccessSchema = z.object({
  studentNumber: z.string().trim().min(4).max(32),
  email: z.string().trim().email(),
});

export async function signInAction(
  _: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = loginSchema.safeParse({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.success) {
    return {
      ok: false,
      message:
        result.error.issues[0]?.message ??
        "Enter your email or student ID and password.",
    };
  }

  const identifier = result.data.identifier.toLowerCase();
  let signInEmails = [identifier];
  if (!identifier.includes("@")) {
    const studentNumber = normalizeStudentNumber(result.data.identifier);
    const staffNumber = normalizeStaffNumber(result.data.identifier);
    const admin = createAdminClient();
    const profileIds = new Set<string>();
    if (isSupportedStudentNumber(studentNumber)) {
      const { data: student } = await admin
        .from("students")
        .select("id,profile_id")
        .eq("student_number", studentNumber)
        .is("deleted_at", null)
        .maybeSingle();
      if (typeof student?.profile_id === "string") profileIds.add(student.profile_id);

      // A ward ID is an accepted parent login alias. We only try linked, active
      // parent accounts, and the supplied password still selects the right account.
      const studentId = typeof student?.id === "string" ? student.id : "";
      if (studentId) {
        const { data: parentLinks } = await admin
          .from("parent_students")
          .select("parent_profile_id")
          .eq("student_id", studentId)
          .is("deleted_at", null);
        for (const link of parentLinks ?? []) {
          if (typeof link.parent_profile_id === "string") profileIds.add(link.parent_profile_id);
        }
      }
    } else if (isSupportedStaffNumber(staffNumber)) {
      const { data: staff } = await admin
        .from("staff_profiles")
        .select("profile_id")
        .eq("staff_number", staffNumber)
        .is("deleted_at", null)
        .maybeSingle();
      if (typeof staff?.profile_id === "string") profileIds.add(staff.profile_id);
    } else {
      return {
        ok: false,
        message: "We could not sign you in. Check your details and try again.",
      };
    }
    if (!profileIds.size) {
      return {
        ok: false,
        message: "We could not sign you in. Check your details and try again.",
      };
    }
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,email")
      .in("id", Array.from(profileIds))
      .eq("is_active", true)
      .is("deleted_at", null);
    const currentEmails = await Promise.all(
      (profiles ?? []).map(async (profile) => {
        const fallback = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
        if (typeof profile.id !== "string") return fallback;
        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        return authUser.user?.email?.trim().toLowerCase() || fallback;
      }),
    );
    signInEmails = Array.from(
      new Set(
        currentEmails.filter(Boolean),
      ),
    );
    if (!signInEmails.length) {
      return {
        ok: false,
        message: "We could not sign you in. Check your details and try again.",
      };
    }
  }

  const supabase = await createServerSupabaseClient();
  let signedInUser: User | null = null;
  for (const email of signInEmails) {
    const attempt = await supabase.auth.signInWithPassword({
      email,
      password: result.data.password,
    });
    if (attempt.data.user) {
      signedInUser = attempt.data.user;
      break;
    }
  }

  if (!signedInUser) {
    return {
      ok: false,
      message: "We could not sign you in. Check your details and try again.",
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role_id,is_active,deleted_at,email")
    .eq("id", signedInUser.id)
    .maybeSingle();
  let roleName: string | undefined;

  if (!profile || profile.is_active === false || profile.deleted_at) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message:
        "This portal account is not active. Please contact the school administrator.",
    };
  }

  if (profile?.role_id && typeof profile.role_id === "string") {
    const { data: role } = await admin
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .maybeSingle();
    if (typeof role?.name === "string") roleName = role.name;
  }

  // Auth is the source of truth for a confirmed sign-in email. This keeps the
  // profile directory in sync after a user changes their account email.
  if (signedInUser.email && profile.email !== signedInUser.email) {
    await admin
      .from("profiles")
      .update({ email: signedInUser.email.toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", signedInUser.id);
  }

  await admin
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", signedInUser.id);
  await admin
    .from("portal_invitations")
    .update({
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("auth_user_id", signedInUser.id)
    .eq("status", "invited");

  const roleHome: Record<string, string> = {
    school_owner: "/admin",
    super_admin: "/admin",
    school_admin: "/admin",
    teacher: "/teacher",
    student: "/student",
    parent: "/parent",
    hr_staff: "/hr",
    finance_officer: "/finance",
    librarian: "/library",
    it_support: "/it",
  };
  redirect(roleHome[roleName ?? ""] ?? "/admin");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestParentAccessAction(
  _: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = parentAccessSchema.safeParse({
    studentNumber: String(formData.get("studentNumber") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!result.success)
    return {
      ok: false,
      message: "Enter the ward's student ID and your email address.",
    };

  const studentNumber = normalizeStudentNumber(result.data.studentNumber);
  const email = result.data.email.toLowerCase();
  if (!isSupportedStudentNumber(studentNumber))
    return {
      ok: false,
      message: "Enter the student ID printed on the ward's Crestview card.",
    };

  const admin = createAdminClient();
  const { data: studentData } = await admin
    .from("students")
    .select(
      "id,student_number,profiles!students_profile_id_fkey(first_name,last_name,metadata)",
    )
    .eq("student_number", studentNumber)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  const student = studentData as unknown as {
    id: string;
    student_number: string;
    profiles:
      | { first_name: string; last_name: string; metadata: Json | null }
      | { first_name: string; last_name: string; metadata: Json | null }[]
      | null;
  } | null;
  if (!student)
    return {
      ok: true,
      message:
        "If the details match the school record, a secure access link will be sent shortly.",
    };

  const studentProfile = Array.isArray(student.profiles)
    ? (student.profiles[0] ?? null)
    : student.profiles;
  const metadata =
    studentProfile?.metadata &&
    typeof studentProfile.metadata === "object" &&
    !Array.isArray(studentProfile.metadata)
      ? (studentProfile.metadata as Record<string, unknown>)
      : {};
  const knownGuardianEmails = new Set(
    [metadata.guardian_email, metadata.source_contact_email]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.includes("@"),
      )
      .map((value) => value.trim().toLowerCase()),
  );
  const { data: linksData } = await admin
    .from("parent_students")
    .select(
      "parent_profile_id,profiles!parent_students_parent_profile_id_fkey(id,email,first_name,last_name)",
    )
    .eq("student_id", student.id)
    .is("deleted_at", null);
  const links = (linksData ?? []) as unknown as Array<{
    parent_profile_id: string;
    profiles:
      | { id: string; email: string; first_name: string; last_name: string }
      | { id: string; email: string; first_name: string; last_name: string }[]
      | null;
  }>;
  const matchedParent = links
    .map((link) => ({
      ...link,
      profile: Array.isArray(link.profiles)
        ? (link.profiles[0] ?? null)
        : link.profiles,
    }))
    .find((link) => link.profile?.email.toLowerCase() === email);

  if (matchedParent?.profile) {
    const delivery = await sendPortalAccessEmail({
      admin,
      authEmail: matchedParent.profile.email,
      deliveryEmail: email,
      firstName: matchedParent.profile.first_name,
      lastName: matchedParent.profile.last_name,
      role: "parent",
      redirectTo: `${APP_URL}/reset-password`,
      subject: "Crestview parent portal access",
      intro: `Your guardian access for ${studentNumber} is ready. Use the secure link to choose a password and view your ward's school information.`,
      accountEmailLabel: "Parent sign-in email",
    });
    return delivery.ok
      ? {
          ok: true,
          message: "A secure parent access link has been sent to your email.",
        }
      : {
          ok: false,
          message:
            "We could not send the access link. Please contact the school office.",
        };
  }

  if (!knownGuardianEmails.has(email))
    return {
      ok: false,
      message:
        "We could not verify that email against this ward's guardian record. Ask the school office to add or update your guardian email.",
    };

  const { data: parentRole } = await admin
    .from("roles")
    .select("id")
    .eq("name", "parent")
    .maybeSingle();
  if (!parentRole)
    return {
      ok: false,
      message:
        "Parent access is temporarily unavailable. Please contact the school office.",
    };

  const invitation = await createPortalInvitation({
    admin,
    email,
    firstName: "Parent",
    lastName: studentProfile?.last_name ?? "Guardian",
    role: "parent",
    redirectTo: `${APP_URL}/reset-password`,
    metadata: {
      account_source: "parent_student_id_claim",
      student_number: studentNumber,
    },
  });
  if (!invitation.ok)
    return {
      ok: false,
      message:
        "We could not create parent access. The email may already be linked to another account; contact the school office for help.",
    };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invitation.user.id,
    role_id: parentRole.id,
    first_name: "Parent",
    last_name: studentProfile?.last_name ?? "Guardian",
    email,
    metadata: {
      account_source: "parent_student_id_claim",
      student_number: studentNumber,
    },
  });
  const { error: linkError } = profileError
    ? { error: profileError }
    : await admin.from("parent_students").insert({
        parent_profile_id: invitation.user.id,
        student_id: student.id,
        relationship: "guardian",
      });
  if (profileError || linkError) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return {
      ok: false,
      message:
        "We could not link the parent account. Please contact the school office.",
    };
  }
  return {
    ok: true,
    message:
      "A secure parent access link has been sent to your email. Use it to choose your password.",
  };
}

export async function requestPasswordResetAction(
  _: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = resetPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!result.success)
    return { ok: false, message: "Enter a valid email address." };

  const supabase = await createServerSupabaseClient();
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const requestOrigin = forwardedHost
    ? `${forwardedProto.split(",")[0].trim()}://${forwardedHost}`
    : APP_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email,
    {
      redirectTo: `${requestOrigin}/reset-password`,
    },
  );

  return error
    ? {
        ok: false,
        message:
          error.status === 429
            ? "The reset email limit has been reached. Wait a little while before requesting another link, then try again once."
            : "We could not send the reset link. Please check the account email or contact the school office.",
      }
    : {
        ok: true,
        message: "If the account exists, a reset link has been sent.",
      };
}

export async function updatePasswordAction(
  _: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = updatePasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!result.success)
    return {
      ok: false,
      message: result.error.issues[0]?.message ?? "Check your new password.",
    };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  return error
    ? {
        ok: false,
        message:
          "Your password could not be updated. Open a fresh reset link and try again.",
      }
    : { ok: true, message: "Password updated. You can now sign in." };
}
