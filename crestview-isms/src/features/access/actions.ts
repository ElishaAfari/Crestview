"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAdminSchema, portalInviteSchema } from "@/lib/validations/access.schema";

export type AccessActionState = { ok: boolean; message: string };

function matchesSecret(input: string, expected: string | undefined) {
  if (!expected) return false;
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);
  return inputBytes.length === expectedBytes.length && timingSafeEqual(inputBytes, expectedBytes);
}

export async function isBootstrapAvailable() {
  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
  return count === 0;
}

export async function bootstrapHeadAdminAction(_: AccessActionState, formData: FormData): Promise<AccessActionState> {
  const result = bootstrapAdminSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    setupCode: String(formData.get("setupCode") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the setup form." };
  if (!matchesSecret(result.data.setupCode, process.env.CRESTVIEW_BOOTSTRAP_CODE)) {
    return { ok: false, message: "The setup code is not valid." };
  }

  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
  if (count !== 0) return { ok: false, message: "Head administrator setup is already complete. Ask an administrator for an invitation." };

  const { data: role } = await admin.from("roles").select("id").eq("name", "super_admin").single();
  if (!role) return { ok: false, message: "The head administrator role is not configured." };

  const email = result.data.email.toLowerCase();
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email,
    password: result.data.password,
    email_confirm: true,
    user_metadata: { first_name: result.data.firstName, last_name: result.data.lastName, role: "super_admin" }
  });
  if (accountError || !account.user) return { ok: false, message: "The head administrator account could not be created." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: account.user.id,
    role_id: role.id,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    email,
    onboarding_completed_at: new Date().toISOString(),
    metadata: { account_source: "head_bootstrap" }
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(account.user.id);
    return { ok: false, message: "The head administrator profile could not be created." };
  }

  return { ok: true, message: "Head administrator account created. You can now sign in." };
}

export async function invitePortalUserAction(_: AccessActionState, formData: FormData): Promise<AccessActionState> {
  const result = portalInviteSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the invitation." };

  const { user, role: currentRole } = await requireRoles(["super_admin", "school_admin"]);
  if (result.data.role === "school_admin" && currentRole !== "super_admin") {
    return { ok: false, message: "Only the head administrator can invite another school administrator." };
  }

  const admin = createAdminClient();
  const email = result.data.email.toLowerCase();
  const { data: role } = await admin.from("roles").select("id").eq("name", result.data.role).single();
  if (!role) return { ok: false, message: "The selected role is not configured." };

  const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/api/auth/callback?next=/reset-password`,
    data: { first_name: result.data.firstName, last_name: result.data.lastName, role: result.data.role, beta_access: true }
  });
  if (invitationError || !invitation.user) return { ok: false, message: "The invitation could not be sent. The email may already have an account." };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invitation.user.id,
    role_id: role.id,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    email,
    metadata: { account_source: "admin_beta_invite", beta_access: true }
  });
  const { error: auditError } = profileError ? { error: profileError } : await admin.from("portal_invitations").insert({
    email,
    role_id: role.id,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    invited_by: user.id,
    auth_user_id: invitation.user.id,
    metadata: { beta_access: true }
  });

  if (profileError || auditError) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return { ok: false, message: "The invitation record could not be created." };
  }

  revalidatePath("/admin/access");
  return { ok: true, message: "Beta invitation sent." };
}
