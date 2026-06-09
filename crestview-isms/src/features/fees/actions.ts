"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { feeSchema } from "@/lib/validations/fee.schema";

const classInvoiceSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().min(0),
  currency: z.string().trim().length(3),
  dueDate: z.string().date()
});

function invoiceNumber(prefix = "INV") {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createInvoiceAction(formData: FormData) {
  const result = feeSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    dueDate: String(formData.get("dueDate") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the invoice details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const number = invoiceNumber();
  const { data: invoiceData, error } = await admin.from("invoices").insert({
    student_id: result.data.studentId,
    invoice_number: number,
    title: "School fees",
    amount: result.data.amount,
    currency: result.data.currency.toUpperCase(),
    due_date: result.data.dueDate,
    issued_by: user.id,
    sent_at: new Date().toISOString(),
    status: "open"
  }).select("id").single();

  const invoice = invoiceData as { id: string } | null;
  if (!error && invoice?.id) {
    const { data: parents } = await admin.from("parent_students").select("parent_profile_id").eq("student_id", result.data.studentId).is("deleted_at", null);
    const recipients = Array.from(new Set(((parents ?? []) as Array<{ parent_profile_id: string }>).map((row) => row.parent_profile_id)));
    if (recipients.length) {
      await admin.from("notifications").insert(recipients.map((recipientId) => ({
        recipient_id: recipientId,
        title: "New fee invoice",
        body: `A new invoice for ${result.data.currency.toUpperCase()} ${Number(result.data.amount).toLocaleString("en-GH")} has been issued.`,
        type: "finance",
        metadata: { invoice_id: invoice.id, student_id: result.data.studentId }
      })));
    }
  }

  revalidatePath("/admin/fees");
  revalidatePath("/finance");
  revalidatePath("/parent/fees");

  return error
    ? { ok: false, message: "The invoice could not be created. Check the student and your finance access." }
    : { ok: true, message: `Invoice ${number} created and sent.` };
}

export async function createClassInvoiceBatchAction(formData: FormData) {
  const result = classInvoiceSchema.safeParse({
    classroomId: String(formData.get("classroomId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    dueDate: String(formData.get("dueDate") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the class billing details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data: students } = await admin
    .from("students")
    .select("id,student_number")
    .eq("classroom_id", result.data.classroomId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("student_number");

  const studentRows = (students ?? []) as Array<{ id: string; student_number: string }>;
  if (!studentRows.length) return { ok: false, message: "No active students were found in that class." };

  const batchNumber = invoiceNumber("BILL");
  const { data: batchData, error: batchError } = await admin.from("billing_batches").insert({
    batch_number: batchNumber,
    classroom_id: result.data.classroomId,
    title: result.data.title,
    description: result.data.description || null,
    amount: result.data.amount,
    currency: result.data.currency.toUpperCase(),
    due_date: result.data.dueDate,
    status: "open",
    created_by: user.id,
    sent_at: new Date().toISOString(),
    metadata: { student_count: studentRows.length }
  }).select("id").single();

  const batch = batchData as { id: string } | null;
  if (batchError || !batch) return { ok: false, message: "The class billing batch could not be created." };

  const invoiceRows = studentRows.map((student) => ({
    student_id: student.id,
    invoice_number: invoiceNumber("INV"),
    title: result.data.title,
    description: result.data.description || null,
    classroom_id: result.data.classroomId,
    billing_batch_id: batch.id,
    amount: result.data.amount,
    currency: result.data.currency.toUpperCase(),
    due_date: result.data.dueDate,
    issued_by: user.id,
    sent_at: new Date().toISOString(),
    status: "open",
    metadata: { batch_number: batchNumber, student_number: student.student_number }
  }));
  const { data: createdInvoices, error: invoiceError } = await admin.from("invoices").insert(invoiceRows).select("id,student_id");
  if (invoiceError) {
    await admin.from("billing_batches").update({ status: "void", deleted_at: new Date().toISOString() }).eq("id", batch.id);
    return { ok: false, message: "The class invoices could not be generated." };
  }

  const studentIds = studentRows.map((student) => student.id);
  const { data: parentLinks } = await admin.from("parent_students").select("parent_profile_id,student_id").in("student_id", studentIds).is("deleted_at", null);
  const invoiceByStudent = new Map(((createdInvoices ?? []) as Array<{ id: string; student_id: string }>).map((invoice) => [invoice.student_id, invoice.id]));
  const notifications = ((parentLinks ?? []) as Array<{ parent_profile_id: string; student_id: string }>).map((link) => ({
    recipient_id: link.parent_profile_id,
    title: result.data.title,
    body: `A class fee invoice for ${result.data.currency.toUpperCase()} ${Number(result.data.amount).toLocaleString("en-GH")} has been issued.`,
    type: "finance",
    metadata: { billing_batch_id: batch.id, invoice_id: invoiceByStudent.get(link.student_id) ?? null, student_id: link.student_id }
  }));
  if (notifications.length) await admin.from("notifications").insert(notifications);

  revalidatePath("/admin/fees");
  revalidatePath("/finance");
  revalidatePath("/parent/fees");
  revalidatePath("/parent");
  return { ok: true, message: `${studentRows.length} class invoices created and sent under ${batchNumber}.` };
}
