"use server";

import { requireUser } from "@/features/auth/guards";

export async function refreshAnalyticsAction() {
  await requireUser();
  return { ok: true, message: "Analytics refresh passed authentication guard." };
}
