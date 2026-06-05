"use server";

import { revalidatePath } from "next/cache";
import { requireRoles, requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleName } from "@/types/database.types";

export async function broadcastNotificationAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all") as RoleName | "all";
  if (title.length < 3) return { ok: false, message: "Enter a notification title." };
  if (body.length < 5) return { ok: false, message: "Write a longer notification body." };

  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  let query = admin.from("profiles").select("id,roles(name)").eq("is_active", true).is("deleted_at", null);
  if (audience !== "all") query = query.eq("roles.name", audience);
  const { data: profiles, error: profileError } = await query;
  if (profileError) return { ok: false, message: "Recipients could not be loaded." };

  const recipients = ((profiles ?? []) as unknown as Array<{ id: string; roles: { name: string } | { name: string }[] | null }>)
    .filter((profile) => {
      if (audience === "all") return true;
      const role = Array.isArray(profile.roles) ? profile.roles[0]?.name : profile.roles?.name;
      return role === audience;
    })
    .map((profile) => profile.id);

  if (!recipients.length) return { ok: false, message: "No active recipients matched that audience." };

  const { error } = await admin.from("notifications").insert(recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title,
    body,
    type: "broadcast",
    metadata: { audience }
  })));

  if (error) return { ok: false, message: "The broadcast could not be queued." };
  revalidatePath("/admin/settings");
  return { ok: true, message: `Broadcast queued for ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.` };
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) return { ok: false, message: "Select a notification." };

  const { user } = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  return error ? { ok: false, message: "Notification could not be updated." } : { ok: true, message: "Notification marked as read." };
}

export async function markAllNotificationsReadAction() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null)
    .is("deleted_at", null);

  return error ? { ok: false, message: "Notifications could not be updated." } : { ok: true, message: "Notifications marked as read." };
}
