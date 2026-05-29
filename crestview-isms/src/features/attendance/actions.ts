"use server";

import { requireUser } from "@/features/auth/guards";

export async function recordAttendanceAction() {
  await requireUser();
  return { ok: true, message: "Attendance recording passed authentication guard." };
}
