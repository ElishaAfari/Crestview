"use server";

import { requireUser } from "@/features/auth/guards";

export async function createAssignmentAction() {
  await requireUser();
  return { ok: true, message: "Assignment creation passed authentication guard." };
}
