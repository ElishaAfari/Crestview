"use server";

import { requireUser } from "@/features/auth/guards";

export async function createInvoiceAction() {
  await requireUser();
  return { ok: true, message: "Invoice creation passed authentication guard." };
}
