"use server";

import { requireUser } from "@/features/auth/guards";

export async function broadcastNotificationAction() {
  await requireUser();
  return { ok: true, message: "Notification broadcast passed authentication guard." };
}
