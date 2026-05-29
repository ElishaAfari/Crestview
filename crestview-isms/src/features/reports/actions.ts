"use server";

import { requireUser } from "@/features/auth/guards";

export async function generateReportAction() {
  await requireUser();
  return { ok: true, message: "Report generation passed authentication guard." };
}
