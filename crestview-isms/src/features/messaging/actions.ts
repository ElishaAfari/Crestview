"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, RoleName } from "@/types/database.types";

const allRoles: RoleName[] = ["super_admin", "school_admin", "teacher", "student", "parent", "hr_staff", "finance_officer", "librarian", "it_support"];

const messageSchema = z.object({
  title: z.string().trim().max(140).optional(),
  body: z.string().trim().min(1, "Write a message before sending.").max(4000),
  recipientIds: z.array(z.string().uuid()).min(1, "Choose at least one recipient.").max(40)
});

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function recipientIdsFrom(formData: FormData) {
  const direct = formData.getAll("recipientId").map((value) => String(value));
  const packed = String(formData.get("recipientIds") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set([...direct, ...packed]));
}

export async function sendMessageAction(formData: FormData) {
  const result = messageSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    recipientIds: recipientIdsFrom(formData)
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the message." };

  const { user, role } = await requireRoles(allRoles);
  const admin = createAdminClient();
  const { data: senderData } = await admin
    .from("profiles")
    .select("id,first_name,last_name,email,roles(name)")
    .eq("id", user.id)
    .maybeSingle();
  const sender = senderData as unknown as { id: string; first_name: string; last_name: string; roles: { name: string } | { name: string }[] | null } | null;
  if (!sender) return { ok: false, message: "Your sender profile could not be found." };

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,first_name,last_name,email,phone,is_active,roles(name)")
    .in("id", result.data.recipientIds)
    .is("deleted_at", null);
  const recipients = ((profiles ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    is_active: boolean | null;
    roles: { name: string } | { name: string }[] | null;
  }>).filter((profile) => profile.is_active !== false && profile.id !== user.id);
  if (!recipients.length) return { ok: false, message: "No active recipients were found." };

  if (role === "student" || role === "parent") {
    const allowedRecipientRoles = new Set(["super_admin", "school_admin", "teacher", "hr_staff", "finance_officer"]);
    const blocked = recipients.some((recipient) => !allowedRecipientRoles.has(one(recipient.roles)?.name ?? ""));
    if (blocked) return { ok: false, message: "Students and parents can only message school staff." };
  }

  const title = result.data.title || `Portal message from ${sender.first_name} ${sender.last_name}`;
  const { data: conversationData, error: conversationError } = await admin
    .from("conversations")
    .insert({ title, created_by: user.id })
    .select("id")
    .single();
  const conversation = conversationData as { id: string } | null;
  if (conversationError || !conversation) return { ok: false, message: "The conversation could not be created." };

  const memberRows = Array.from(new Set([user.id, ...recipients.map((recipient) => recipient.id)])).map((profileId) => ({
    conversation_id: conversation.id,
    profile_id: profileId
  }));
  const { error: memberError } = await admin.from("conversation_members").insert(memberRows);
  if (memberError) return { ok: false, message: "Conversation members could not be saved." };

  const { data: messageData, error: messageError } = await admin
    .from("messages")
    .insert({ conversation_id: conversation.id, sender_id: user.id, body: result.data.body })
    .select("id")
    .single();
  const message = messageData as { id: string } | null;
  if (messageError || !message) return { ok: false, message: "The message could not be saved." };

  await Promise.all([
    admin.from("notifications").insert(recipients.map((recipient) => ({
      recipient_id: recipient.id,
      title,
      body: result.data.body.slice(0, 240),
      type: "message",
      metadata: { conversation_id: conversation.id, message_id: message.id, sender_id: user.id } satisfies Json
    }))),
    admin.from("email_outbox").insert(recipients.map((recipient) => ({
      recipient_email: recipient.email,
      recipient_profile_id: recipient.id,
      subject: title,
      html_body: `<p>${result.data.body.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br />")}</p>`,
      text_body: result.data.body,
      status: "queued",
      metadata: { conversation_id: conversation.id, message_id: message.id, sender_id: user.id } satisfies Json
    }))),
    admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "SEND message",
      table_name: "messages",
      record_id: message.id,
      after: { conversation_id: conversation.id, recipient_count: recipients.length } satisfies Json
    })
  ]);

  revalidatePath("/parent/messages");
  revalidatePath("/student/messages");
  revalidatePath("/teacher/messages");
  revalidatePath("/admin/automation");
  return { ok: true, message: `Message sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.` };
}
