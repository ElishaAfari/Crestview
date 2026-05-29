"use server";

import { requireUser } from "@/features/auth/guards";

export async function createJobPostingAction() {
  await requireUser();
  return { ok: true, message: "Job posting creation passed authentication guard." };
}
