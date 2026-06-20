import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { APP_NAME, APP_URL } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

type DeliveryMethod = "crestview" | "supabase_auth";

type PortalInviteInput = {
  admin: AdminClient;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  redirectTo?: string;
  metadata?: Record<string, unknown>;
};

type PortalAccessInput = {
  admin: AdminClient;
  authEmail: string;
  deliveryEmail?: string;
  firstName: string;
  lastName: string;
  role: string;
  redirectTo?: string;
  subject?: string;
  intro?: string;
  buttonLabel?: string;
  accountEmailLabel?: string;
};

type InviteResult =
  | { ok: true; user: User; delivery: DeliveryMethod; deliveredTo: string }
  | { ok: false; message: string };

type AccessResult =
  | { ok: true; delivery: DeliveryMethod; deliveredTo: string }
  | { ok: false; message: string };

const roleLabels: Record<string, string> = {
  super_admin: "Head Administrator",
  school_admin: "School Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent or Guardian",
  hr_staff: "HR Staff",
  finance_officer: "Finance Officer",
  librarian: "Librarian",
  it_support: "IT Support"
};

function roleLabel(role: string) {
  return roleLabels[role] ?? role.replaceAll("_", " ");
}

function mailFrom() {
  return process.env.CRESTVIEW_EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM;
}

function replyTo() {
  return process.env.CRESTVIEW_EMAIL_REPLY_TO ?? process.env.REPLY_TO_EMAIL;
}

function canSendCrestviewMail() {
  return Boolean(process.env.RESEND_API_KEY && mailFrom());
}

function isRoutableEmail(email: string) {
  const value = email.trim().toLowerCase();
  return value.includes("@") && !value.endsWith(".local");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function brandedPortalEmail({
  name,
  role,
  actionUrl,
  subject,
  intro,
  buttonLabel,
  accountEmail,
  accountEmailLabel
}: {
  name: string;
  role: string;
  actionUrl: string;
  subject: string;
  intro: string;
  buttonLabel: string;
  accountEmail: string;
  accountEmailLabel: string;
}) {
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleLabel(role));
  const safeSubject = escapeHtml(subject);
  const safeIntro = escapeHtml(intro);
  const safeButton = escapeHtml(buttonLabel);
  const safeAccountEmail = escapeHtml(accountEmail);
  const safeAccountLabel = escapeHtml(accountEmailLabel);
  const safeUrl = escapeHtml(actionUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;background:#eef5ff;font-family:Arial,Helvetica,sans-serif;color:#061a4c;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5ff;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #bfd8fa;border-radius:14px;overflow:hidden;box-shadow:0 24px 54px -30px rgba(7,55,127,0.55);">
            <tr>
              <td style="background:#07377f;padding:26px 30px;color:#ffffff;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0;text-transform:uppercase;color:#ffd83d;">${escapeHtml(APP_NAME)}</div>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;font-weight:900;">Congratulations, ${safeName}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0;font-size:16px;line-height:1.7;color:#102a56;">${safeIntro}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#f3f8ff;border:1px solid #bfd8fa;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px;font-size:13px;font-weight:800;text-transform:uppercase;color:#174ea6;">Portal role</p>
                      <p style="margin:0;font-size:18px;font-weight:900;color:#061a4c;">${safeRole}</p>
                      <p style="margin:14px 0 0;font-size:13px;font-weight:800;text-transform:uppercase;color:#174ea6;">${safeAccountLabel}</p>
                      <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#061a4c;">${safeAccountEmail}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#102a56;">Use the secure button below to choose your password and enter the Crestview portal. The link is private and should not be shared.</p>
                <p style="margin:0 0 28px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#cf1017;color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 22px;border-radius:10px;">${safeButton}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#48607f;">If the button does not work, copy and paste this link into your browser:<br /><span style="word-break:break-all;color:#174ea6;">${safeUrl}</span></p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fbff;border-top:1px solid #d7e9ff;padding:18px 30px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#48607f;">This message was sent by ${escapeHtml(APP_NAME)}. If you were not expecting this portal access email, please contact the school office.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendCrestviewEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = mailFrom();
  if (!apiKey || !from) return { ok: false as const, message: "Crestview email provider is not configured." };

  const body: Record<string, unknown> = { from, to, subject, html };
  const configuredReplyTo = replyTo();
  if (configuredReplyTo) body.reply_to = configuredReplyTo;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) return { ok: false as const, message: `Crestview email provider rejected the message (${response.status}).` };
  return { ok: true as const };
}

async function sendNativeInvite(input: PortalInviteInput): Promise<InviteResult> {
  const { admin, email, firstName, lastName, role, redirectTo = `${APP_URL}/reset-password`, metadata = {} } = input;
  if (!isRoutableEmail(email)) return { ok: false, message: "A real email address is required before a portal access email can be sent." };
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { ...metadata, first_name: firstName, last_name: lastName, role, school_name: APP_NAME }
  });
  if (error || !data.user) return { ok: false, message: "The secure access email could not be sent. The email may already have an account." };
  return { ok: true, user: data.user, delivery: "supabase_auth", deliveredTo: email };
}

export async function createPortalInvitation(input: PortalInviteInput): Promise<InviteResult> {
  const { admin, email, firstName, lastName, role, redirectTo = `${APP_URL}/reset-password`, metadata = {} } = input;
  if (!canSendCrestviewMail()) return sendNativeInvite(input);

  const userMetadata = { ...metadata, first_name: firstName, last_name: lastName, role, school_name: APP_NAME };
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo, data: userMetadata }
  });
  if (error || !data.user || !data.properties?.action_link) return sendNativeInvite(input);

  const name = `${firstName} ${lastName}`.trim() || "Crestview user";
  const subject = `Congratulations - your ${APP_NAME} portal access is ready`;
  const html = brandedPortalEmail({
    name,
    role,
    actionUrl: data.properties.action_link,
    subject,
    intro: `${APP_NAME} has created your ${roleLabel(role)} portal account. Welcome to the Crestview digital workspace.`,
    buttonLabel: "Choose password and open portal",
    accountEmail: email,
    accountEmailLabel: "Sign-in email"
  });
  const sent = await sendCrestviewEmail(email, subject, html);
  if (!sent.ok) {
    await admin.auth.admin.deleteUser(data.user.id);
    return sendNativeInvite(input);
  }

  return { ok: true, user: data.user, delivery: "crestview", deliveredTo: email };
}

async function sendNativeRecovery(input: PortalAccessInput): Promise<AccessResult> {
  const { admin, authEmail, redirectTo = `${APP_URL}/reset-password` } = input;
  const { error } = await admin.auth.resetPasswordForEmail(authEmail, { redirectTo });
  if (error) return { ok: false, message: "The secure access email could not be sent." };
  return { ok: true, delivery: "supabase_auth", deliveredTo: authEmail };
}

export async function sendPortalAccessEmail(input: PortalAccessInput): Promise<AccessResult> {
  const {
    admin,
    authEmail,
    deliveryEmail = authEmail,
    firstName,
    lastName,
    role,
    redirectTo = `${APP_URL}/reset-password`,
    subject = `Your ${APP_NAME} portal access link`,
    intro = `${APP_NAME} has prepared your portal account. You can now choose a password and continue into your workspace.`,
    buttonLabel = "Choose password and open portal",
    accountEmailLabel = "Sign-in email"
  } = input;
  const authTarget = authEmail.trim().toLowerCase();
  const deliveryTarget = deliveryEmail.trim().toLowerCase();
  const sameInbox = authTarget === deliveryTarget;
  if (!isRoutableEmail(deliveryTarget)) {
    return { ok: false, message: "No deliverable recipient email is linked to this account." };
  }

  if (!canSendCrestviewMail()) {
    if (sameInbox) return sendNativeRecovery(input);
    return {
      ok: false,
      message: "Crestview email provider is not configured, so this student setup link cannot be delivered to the guardian inbox."
    };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: authTarget,
    options: { redirectTo }
  });
  if (error || !data.properties?.action_link) {
    if (sameInbox) return sendNativeRecovery(input);
    return { ok: false, message: "The student setup link could not be generated." };
  }

  const name = `${firstName} ${lastName}`.trim() || "Crestview user";
  const html = brandedPortalEmail({
    name,
    role,
    actionUrl: data.properties.action_link,
    subject,
    intro,
    buttonLabel,
    accountEmail: authTarget,
    accountEmailLabel
  });
  const sent = await sendCrestviewEmail(deliveryTarget, subject, html);
  if (!sent.ok) {
    if (sameInbox) return sendNativeRecovery(input);
    return { ok: false, message: sent.message };
  }

  return { ok: true, delivery: "crestview", deliveredTo: deliveryTarget };
}
