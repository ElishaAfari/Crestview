"use server";

import { requireUser } from "@/features/auth/guards";

export async function sendMessageAction() {
  await requireUser();
  return { ok: true, message: "Message send passed authentication guard." };
}
