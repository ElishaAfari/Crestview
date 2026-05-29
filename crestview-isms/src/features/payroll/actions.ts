"use server";

import { requireUser } from "@/features/auth/guards";

export async function processPayrollAction() {
  await requireUser();
  return { ok: true, message: "Payroll processing passed authentication guard." };
}
