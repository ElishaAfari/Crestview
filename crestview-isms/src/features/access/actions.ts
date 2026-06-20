"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/constants";
import { requireRoles } from "@/features/auth/guards";
import { createPortalInvitation, sendPortalAccessEmail } from "@/lib/email/portal-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootstrapAdminSchema, portalInviteSchema, resendPortalAccessSchema, updatePortalAccountSchema } from "@/lib/validations/access.schema";
import type { Json } from "@/types/database.types";

export type AccessActionState = { ok: boolean; message: string };

function matchesSecret(input: string, expected: string | undefined) {
  if (!expected) return false;
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);
  return inputBytes.length === expectedBytes.length && timingSafeEqual(inputBytes, expectedBytes);
}

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function metadataRecord(metadata: Json | null | undefined): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
}

function isDeliverableEmail(email: string | null | undefined) {
  return Boolean(email && email.includes("@") && !email.toLowerCase().endsWith(".local"));
}

async function resolveStudentDeliveryEmail(admin: ReturnType<typeof createAdminClient>, profileId: string, metadata: Json | null | undefined) {
  const guardianEmail = metadataRecord(metadata).guardian_email;
  if (typeof guardianEmail === "string" && isDeliverableEmail(guardianEmail)) return guardianEmail.toLowerCase();

  const { data: student } = await admin.from("students").select("id").eq("profile_id", profileId).maybeSingle();
  const studentId = (student as { id: string } | null)?.id;
  if (!studentId) return null;

  const { data: link } = await admin.from("parent_students").select("parent_profile_id").eq("student_id", studentId).limit(1).maybeSingle();
  const parentProfileId = (link as { parent_profile_id: string | null } | null)?.parent_profile_id;
  if (!parentProfileId) return null;

  const { data: parent } = await admin.from("profiles").select("email").eq("id", parentProfileId).maybeSingle();
  const parentEmail = (parent as { email: string | null } | null)?.email;
  return isDeliverableEmail(parentEmail) ? parentEmail!.toLowerCase() : null;
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

  const invitation = await createPortalInvitation({
    admin,
    email,
    firstName: result.data.firstName,
    lastName: result.data.lastName,
    role: result.data.role,
    redirectTo: `${APP_URL}/reset-password`,
    metadata: { pilot_access: true, account_source: "admin_pilot_invite" }
  });
  if (!invitation.ok) return { ok: false, message: invitation.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: invitation.user.id,
    role_id: role.id,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    email,
    metadata: { account_source: "admin_pilot_invite", pilot_access: true }
  });
  const { error: auditError } = profileError ? { error: profileError } : await admin.from("portal_invitations").insert({
    email,
    role_id: role.id,
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    invited_by: user.id,
    auth_user_id: invitation.user.id,
    metadata: { pilot_access: true }
  });

  if (profileError || auditError) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return { ok: false, message: "The invitation record could not be created." };
  }

  revalidatePath("/admin/access");
  const delivery = invitation.delivery === "crestview" ? "Crestview-branded access email" : "Supabase Auth access email";
  return { ok: true, message: `Portal account created. ${delivery} sent to ${invitation.deliveredTo}.` };
}

export async function updatePortalAccountAction(_: AccessActionState, formData: FormData): Promise<AccessActionState> {
  const result = updatePortalAccountSchema.safeParse({
    accountId: String(formData.get("accountId") ?? ""),
    role: String(formData.get("role") ?? ""),
    status: String(formData.get("status") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the account settings." };

  const { user, role: currentRole } = await requireRoles(["super_admin", "school_admin"]);
  const isActive = result.data.status === "active";
  if (result.data.accountId === user.id && (!isActive || result.data.role !== currentRole)) {
    return { ok: false, message: "Keep your own administrator account active with its current role." };
  }

  const admin = createAdminClient();
  const { data: currentProfile } = await admin.from("profiles").select("role_id").eq("id", result.data.accountId).maybeSingle();
  if (!currentProfile) return { ok: false, message: "The selected account no longer exists." };

  const { data: currentProfileRole } = currentProfile.role_id
    ? await admin.from("roles").select("name").eq("id", currentProfile.role_id).maybeSingle()
    : { data: null };
  if (currentRole !== "super_admin" && (result.data.role === "super_admin" || result.data.role === "school_admin" || currentProfileRole?.name === "super_admin")) {
    return { ok: false, message: "Only the head administrator can assign or change administrator access." };
  }

  const { data: selectedRole } = await admin.from("roles").select("id").eq("name", result.data.role).maybeSingle();
  if (!selectedRole) return { ok: false, message: "The selected role is not configured." };

  const { data: authAccount } = await admin.auth.admin.getUserById(result.data.accountId);
  const { error: authError } = await admin.auth.admin.updateUserById(result.data.accountId, {
    ban_duration: isActive ? "none" : "876000h",
    user_metadata: { ...(authAccount.user?.user_metadata ?? {}), role: result.data.role }
  });
  if (authError) return { ok: false, message: "The authentication account could not be updated." };

  const { error: profileError } = await admin.from("profiles").update({
    role_id: selectedRole.id,
    is_active: isActive
  }).eq("id", result.data.accountId);
  if (profileError) return { ok: false, message: "The portal profile could not be updated." };

  await admin.from("portal_invitations").update({
    role_id: selectedRole.id,
    status: isActive ? "active" : "revoked"
  }).eq("auth_user_id", result.data.accountId);

  revalidatePath("/admin/access");
  return { ok: true, message: "Access settings updated." };
}

export async function resendPortalAccessAction(_: AccessActionState, formData: FormData): Promise<AccessActionState> {
  const result = resendPortalAccessSchema.safeParse({ accountId: String(formData.get("accountId") ?? "") });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Select an account." };

  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from("profiles")
    .select("id,email,first_name,last_name,role_id,is_active,metadata,roles(name)")
    .eq("id", result.data.accountId)
    .maybeSingle();
  const profile = profileData as unknown as {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role_id: string | null;
    is_active: boolean | null;
    metadata: Json | null;
    roles: { name: string } | { name: string }[] | null;
  } | null;
  if (!profile || profile.is_active === false) return { ok: false, message: "Enable this account before resending access." };
  const roleName = one(profile.roles)?.name ?? "unassigned";
  const deliveryEmail = roleName === "student"
    ? await resolveStudentDeliveryEmail(admin, profile.id, profile.metadata) ?? profile.email
    : profile.email;

  const access = await sendPortalAccessEmail({
    admin,
    authEmail: profile.email,
    deliveryEmail,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: roleName,
    redirectTo: `${APP_URL}/reset-password`,
    intro: roleName === "student"
      ? `${profile.first_name}'s Crestview student portal access is ready. Use this secure link to choose the student account password.`
      : "Your Crestview portal access link is ready. Use this secure link to choose a password and continue into your workspace.",
    subject: roleName === "student" ? `${profile.first_name}'s Crestview student portal access` : "Your Crestview portal access link",
    accountEmailLabel: roleName === "student" ? "Student sign-in email" : "Sign-in email"
  });
  if (!access.ok) return { ok: false, message: access.message };

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: invitation } = await admin.from("portal_invitations").select("id").eq("auth_user_id", profile.id).maybeSingle();
  if (typeof invitation?.id === "string") {
    await admin.from("portal_invitations").update({ status: "invited", expires_at: expiresAt }).eq("id", invitation.id);
  } else if (profile.role_id) {
    await admin.from("portal_invitations").insert({
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role_id: profile.role_id,
      invited_by: user.id,
      auth_user_id: profile.id,
      expires_at: expiresAt,
      metadata: { account_source: "admin_access_resend" }
    });
  }

  revalidatePath("/admin/access");
  const delivery = access.delivery === "crestview" ? "Crestview-branded access email" : "Supabase Auth access email";
  return { ok: true, message: `${delivery} sent to ${access.deliveredTo}.` };
}
