"use server";

import { requireUser } from "@/features/auth/guards";

export async function optimizeTimetableAction() {
  await requireUser();
  return { ok: true, message: "Timetable optimization passed authentication guard." };
}
