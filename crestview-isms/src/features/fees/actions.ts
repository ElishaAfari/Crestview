"use server";

import { requireUser } from "@/features/auth/guards";
import { feeSchema } from "@/lib/validations/fee.schema";

export async function createInvoiceAction(formData: FormData) {
  const result = feeSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    dueDate: String(formData.get("dueDate") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the invoice details." };

  const { supabase } = await requireUser();
  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { error } = await supabase.from("invoices").insert({
    student_id: result.data.studentId,
    invoice_number: invoiceNumber,
    amount: result.data.amount,
    currency: result.data.currency.toUpperCase(),
    due_date: result.data.dueDate,
    status: "draft"
  });

  return error
    ? { ok: false, message: "The invoice could not be created. Check the student and your finance access." }
    : { ok: true, message: `Invoice ${invoiceNumber} created.` };
}
