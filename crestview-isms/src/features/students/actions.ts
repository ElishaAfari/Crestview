"use server";

import { requireUser } from "@/features/auth/guards";

export async function createStudentAction() {
  await requireUser();
  return { ok: true, message: "Student creation passed authentication guard." };
}
