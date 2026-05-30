"use server";

import { redirect } from "next/navigation";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema, resetPasswordSchema, updatePasswordSchema } from "@/lib/validations/auth.schema";

export type SignInState = { ok: boolean; message: string };

export async function signInAction(_: SignInState, formData: FormData): Promise<SignInState> {
  const result = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Enter your email and password." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { ok: false, message: "We could not sign you in. Check your details and try again." };
  }

  const { data: profile } = await supabase.from("profiles").select("role_id").eq("id", data.user.id).maybeSingle();
  let roleName: string | undefined;

  if (profile?.role_id && typeof profile.role_id === "string") {
    const { data: role } = await supabase.from("roles").select("name").eq("id", profile.role_id).maybeSingle();
    if (typeof role?.name === "string") roleName = role.name;
  }

  const admin = createAdminClient();
  await admin.from("profiles").update({
    last_seen_at: new Date().toISOString(),
    onboarding_completed_at: new Date().toISOString()
  }).eq("id", data.user.id);
  await admin.from("portal_invitations").update({
    status: "active",
    accepted_at: new Date().toISOString()
  }).eq("auth_user_id", data.user.id).eq("status", "invited");

  const roleHome: Record<string, string> = { teacher: "/teacher", student: "/student", parent: "/parent" };
  redirect(roleHome[roleName ?? ""] ?? "/admin");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_: SignInState, formData: FormData): Promise<SignInState> {
  const result = resetPasswordSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!result.success) return { ok: false, message: "Enter a valid email address." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${APP_URL}/api/auth/callback?next=/reset-password`
  });

  return error
    ? { ok: false, message: "We could not send the reset link. Please call the school for assistance." }
    : { ok: true, message: "If the account exists, a reset link has been sent." };
}

export async function updatePasswordAction(_: SignInState, formData: FormData): Promise<SignInState> {
  const result = updatePasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check your new password." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: result.data.password });

  return error
    ? { ok: false, message: "Your password could not be updated. Open a fresh reset link and try again." }
    : { ok: true, message: "Password updated. You can now sign in." };
}
