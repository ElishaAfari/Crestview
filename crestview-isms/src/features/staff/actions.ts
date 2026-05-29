"use server";

import { requireUser } from "@/features/auth/guards";

export async function createStaffAction() {
  await requireUser();
  return { ok: true, message: "Staff creation passed authentication guard." };
}
