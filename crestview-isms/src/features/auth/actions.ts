"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupportedStudentNumber, normalizeStudentNumber } from "@/lib/students/student-number";
import {
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth.schema";

export type SignInState = { ok: boolean; message: string };

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
        result.error.issues[0]?.message ?? "Enter your email or student ID and password.",
    };
  }

  let email = result.data.identifier.toLowerCase();
  if (!email.includes("@")) {
    const studentNumber = normalizeStudentNumber(result.data.identifier);
    if (!isSupportedStudentNumber(studentNumber)) {
      return { ok: false, message: "We could not sign you in. Check your details and try again." };
    }
    const admin = createAdminClient();
    const { data: student } = await admin
      .from("students")
      .select("profile_id")
      .eq("student_number", studentNumber)
      .is("deleted_at", null)
      .maybeSingle();
    const profileId = typeof student?.profile_id === "string" ? student.profile_id : "";
    if (!profileId) {
      return { ok: false, message: "We could not sign you in. Check your details and try again." };
    }
    const { data: profile } = await admin.from("profiles").select("email").eq("id", profileId).maybeSingle();
    const portalEmail = typeof profile?.email === "string" ? profile.email : "";
    if (!portalEmail) {
      return { ok: false, message: "We could not sign you in. Check your details and try again." };
    }
    email = portalEmail;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: result.data.password });

  if (error) {
    return {
      ok: false,
      message: "We could not sign you in. Check your details and try again.",
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role_id,is_active,deleted_at")
    .eq("id", data.user.id)
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

  await admin
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", data.user.id);
  await admin
    .from("portal_invitations")
    .update({
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("auth_user_id", data.user.id)
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
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const requestOrigin = forwardedHost ? `${forwardedProto.split(",")[0].trim()}://${forwardedHost}` : APP_URL;
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
