"use server";

import { requireUser } from "@/features/auth/guards";

export async function publishGradeAction() {
  await requireUser();
  return { ok: true, message: "Grade publishing passed authentication guard." };
}
