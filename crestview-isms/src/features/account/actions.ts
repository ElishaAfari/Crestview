"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/features/auth/guards";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
  confirmPassword: z.string().min(10).max(128),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function updateOwnProfileAction(formData: FormData) {
  const result = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check your profile details." };

  const { user } = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    first_name: result.data.firstName,
    middle_name: result.data.middleName || null,
    last_name: result.data.lastName,
    phone: result.data.phone || null,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/account/settings");
  return error ? { ok: false, message: "Your profile could not be updated." } : { ok: true, message: "Profile updated." };
}

export async function changeOwnPasswordAction(formData: FormData) {
  const result = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check your password details." };

  const { user, supabase } = await requireUser();
  if (!user.email) return { ok: false, message: "This account has no sign-in email to verify." };

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: result.data.currentPassword,
  });
  if (verificationError) return { ok: false, message: "The current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: result.data.newPassword });
  return error ? { ok: false, message: "Your password could not be updated. Try again." } : { ok: true, message: "Password updated successfully." };
}

export async function requestOwnEmailChangeAction(formData: FormData) {
  const result = emailSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!result.success) return { ok: false, message: "Enter a valid email address." };

  const { user, supabase } = await requireUser();
  const nextEmail = result.data.email.toLowerCase();
  if (user.email?.toLowerCase() === nextEmail) {
    return { ok: false, message: "That is already the email for this account." };
  }

  const { error } = await supabase.auth.updateUser(
    { email: nextEmail },
    { emailRedirectTo: `${APP_URL}/api/auth/callback?next=/account/settings` },
  );
  if (error) return { ok: false, message: "The email change could not be started. Check the address and try again." };

  revalidatePath("/account/settings");
  return {
    ok: true,
    message: "Confirm the secure email-change message sent by the school portal. Your sign-in email updates after confirmation.",
  };
}
