"use server";

import { requireUser } from "@/features/auth/guards";

export async function generateLessonPlanAction() {
  await requireUser();
  return { ok: true, message: "AI lesson planning passed authentication guard." };
}
