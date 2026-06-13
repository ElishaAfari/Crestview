"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { completeRelatedWorkflowTasks, createWorkflowTask } from "@/features/automation/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { feeSchema } from "@/lib/validations/fee.schema";
import type { Json } from "@/types/database.types";

const classInvoiceSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().min(0),
  currency: z.string().trim().length(3),
  dueDate: z.string().date(),
  feeItems: z.array(z.object({
    description: z.string().trim().min(2).max(160),
    quantity: z.coerce.number().min(0.01).max(999),
    unitAmount: z.coerce.number().min(0).max(999999)
  })).max(20).optional()
});

const invoiceLifecycleSchema = z.object({
  invoiceId: z.string().uuid(),
  intent: z.enum(["mark_paid", "mark_overdue", "void"])
});

function invoiceNumber(prefix = "INV") {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function paymentReference() {
  return `MANUAL-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function notifyInvoiceGuardians({
  studentId,
  invoiceId,
  title,
  body,
  type = "finance"
}: {
  studentId: string;
  invoiceId: string;
  title: string;
  body: string;
  type?: string;
}) {
  const admin = createAdminClient();
  const { data: parents } = await admin.from("parent_students").select("parent_profile_id").eq("student_id", studentId).is("deleted_at", null);
  const recipients = Array.from(new Set(((parents ?? []) as Array<{ parent_profile_id: string }>).map((row) => row.parent_profile_id)));
  if (!recipients.length) return;
  await admin.from("notifications").insert(recipients.map((recipientId) => ({
    recipient_id: recipientId,
    title,
    body,
    type,
    metadata: { invoice_id: invoiceId, student_id: studentId } satisfies Json
  })));
}

async function closeBatchIfSettled(batchId: string | null) {
  if (!batchId) return;
  const admin = createAdminClient();
  const { count } = await admin
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("billing_batch_id", batchId)
    .in("status", ["draft", "open", "overdue"])
    .is("deleted_at", null);
  if ((count ?? 0) === 0) {
    await admin.from("billing_batches").update({ status: "paid" }).eq("id", batchId);
    await completeRelatedWorkflowTasks({
      workflowKey: "finance_collection",
      relatedTable: "billing_batches",
      relatedRecordId: batchId
    });
  }
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
    await createWorkflowTask({
      title: `Collect invoice ${number}`,
      workflowKey: "finance_collection",
      description: "Follow up this individual school fee invoice until it is settled or formally voided.",
      priority: "normal",
      dueAt: new Date(`${result.data.dueDate}T16:00:00`).toISOString(),
      createdBy: user.id,
      studentId: result.data.studentId,
      relatedTable: "invoices",
      relatedRecordId: invoice.id,
      metadata: { invoice_number: number, amount: result.data.amount, currency: result.data.currency.toUpperCase() }
    });
    await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "invoice.class_batch_created");
  }

  revalidatePath("/admin/fees");
  revalidatePath("/finance");
  revalidatePath("/parent/fees");

  return error
    ? { ok: false, message: "The invoice could not be created. Check the student and your finance access." }
    : { ok: true, message: `Invoice ${number} created and sent.` };
}

export async function createClassInvoiceBatchAction(formData: FormData) {
  let feeItems: unknown = [];
  try {
    feeItems = JSON.parse(String(formData.get("feeItemsJson") ?? "[]"));
  } catch {
    feeItems = [];
  }
  const result = classInvoiceSchema.safeParse({
    classroomId: String(formData.get("classroomId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    feeItems
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

  const itemizedTotal = (result.data.feeItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitAmount, 0);
  const invoiceAmount = itemizedTotal > 0 ? Number(itemizedTotal.toFixed(2)) : result.data.amount;
  if (invoiceAmount <= 0) return { ok: false, message: "Enter an amount or at least one fee item." };

  const batchNumber = invoiceNumber("BILL");
  const { data: batchData, error: batchError } = await admin.from("billing_batches").insert({
    batch_number: batchNumber,
    classroom_id: result.data.classroomId,
    title: result.data.title,
    description: result.data.description || null,
    amount: invoiceAmount,
    currency: result.data.currency.toUpperCase(),
    due_date: result.data.dueDate,
    status: "open",
    created_by: user.id,
    sent_at: new Date().toISOString(),
    metadata: { student_count: studentRows.length, itemized: Boolean(result.data.feeItems?.length), fee_items: result.data.feeItems ?? [] }
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
    amount: invoiceAmount,
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
  if (result.data.feeItems?.length && createdInvoices?.length) {
    const invoiceItems = (createdInvoices as Array<{ id: string }>).flatMap((invoice) => result.data.feeItems!.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_amount: item.unitAmount
    })));
    const { error: itemError } = await admin.from("invoice_items").insert(invoiceItems);
    if (itemError) return { ok: false, message: "Invoices were created, but fee line items could not be attached." };
  }

  const studentIds = studentRows.map((student) => student.id);
  const { data: parentLinks } = await admin.from("parent_students").select("parent_profile_id,student_id").in("student_id", studentIds).is("deleted_at", null);
  const invoiceByStudent = new Map(((createdInvoices ?? []) as Array<{ id: string; student_id: string }>).map((invoice) => [invoice.student_id, invoice.id]));
  const notifications = ((parentLinks ?? []) as Array<{ parent_profile_id: string; student_id: string }>).map((link) => ({
    recipient_id: link.parent_profile_id,
    title: result.data.title,
    body: `A class fee invoice for ${result.data.currency.toUpperCase()} ${Number(invoiceAmount).toLocaleString("en-GH")} has been issued.`,
    type: "finance",
    metadata: { billing_batch_id: batch.id, invoice_id: invoiceByStudent.get(link.student_id) ?? null, student_id: link.student_id }
  }));
  if (notifications.length) await admin.from("notifications").insert(notifications);
  await createWorkflowTask({
    title: `Monitor class billing batch ${batchNumber}`,
    workflowKey: "finance_collection",
    description: `${studentRows.length} invoices were broadcast. Track parent receipts, overdue reminders, and collection completion.`,
    priority: "high",
    dueAt: new Date(`${result.data.dueDate}T16:00:00`).toISOString(),
    createdBy: user.id,
    classroomId: result.data.classroomId,
    relatedTable: "billing_batches",
    relatedRecordId: batch.id,
    metadata: {
      batch_number: batchNumber,
      student_count: studentRows.length,
      amount: invoiceAmount,
      currency: result.data.currency.toUpperCase()
    }
  });
  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "invoice.class_batch_created");

  revalidatePath("/admin/fees");
  revalidatePath("/finance");
  revalidatePath("/parent/fees");
  revalidatePath("/parent");
  return { ok: true, message: `${studentRows.length} itemized class invoice${studentRows.length === 1 ? "" : "s"} created and sent under ${batchNumber}.` };
}

export async function updateInvoiceLifecycleAction(_: { ok: boolean; message: string }, formData: FormData) {
  const result = invoiceLifecycleSchema.safeParse({
    invoiceId: String(formData.get("invoiceId") ?? ""),
    intent: String(formData.get("intent") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Choose a valid invoice action." };

  const { user } = await requireRoles(["super_admin", "school_admin", "finance_officer"]);
  const admin = createAdminClient();
  const { data: invoiceData } = await admin
    .from("invoices")
    .select("id,student_id,invoice_number,title,amount,currency,status,due_date,billing_batch_id,classroom_id")
    .eq("id", result.data.invoiceId)
    .is("deleted_at", null)
    .maybeSingle();
  const invoice = invoiceData as {
    id: string;
    student_id: string;
    invoice_number: string;
    title: string | null;
    amount: number;
    currency: string;
    status: string;
    due_date: string;
    billing_batch_id: string | null;
    classroom_id: string | null;
  } | null;
  if (!invoice) return { ok: false, message: "The invoice could not be found." };
  if (invoice.status === "void") return { ok: false, message: "Voided invoices cannot be changed from this register." };

  if (result.data.intent === "mark_paid") {
    if (invoice.status === "paid") return { ok: true, message: "This invoice is already marked paid." };
    const now = new Date().toISOString();
    const { error: paymentError } = await admin.from("payments").insert({
      invoice_id: invoice.id,
      provider: "manual_portal",
      provider_reference: paymentReference(),
      amount: invoice.amount,
      status: "verified",
      paid_at: now,
      metadata: {
        source: "invoice_register",
        recorded_by: user.id,
        previous_invoice_status: invoice.status
      } satisfies Json
    });
    if (paymentError) return { ok: false, message: "Payment receipt could not be recorded." };
    const { error: invoiceError } = await admin.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
    if (invoiceError) return { ok: false, message: "Payment was recorded, but the invoice status could not be updated." };
    await completeRelatedWorkflowTasks({
      workflowKey: "finance_collection",
      relatedTable: "invoices",
      relatedRecordId: invoice.id
    });
    await closeBatchIfSettled(invoice.billing_batch_id);
    await notifyInvoiceGuardians({
      studentId: invoice.student_id,
      invoiceId: invoice.id,
      title: "Fee payment recorded",
      body: `${invoice.invoice_number} has been marked paid for ${invoice.currency} ${Number(invoice.amount).toLocaleString("en-GH")}.`
    });
  }

  if (result.data.intent === "mark_overdue") {
    if (invoice.status !== "overdue") {
      const { error } = await admin.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
      if (error) return { ok: false, message: "The invoice could not be marked overdue." };
    }
    const { count } = await admin
      .from("workflow_tasks")
      .select("*", { count: "exact", head: true })
      .eq("workflow_key", "finance_collection")
      .eq("related_table", "invoices")
      .eq("related_record_id", invoice.id)
      .in("status", ["open", "in_progress", "blocked"]);
    if ((count ?? 0) === 0) {
      await createWorkflowTask({
        title: `Overdue fee follow-up ${invoice.invoice_number}`,
        workflowKey: "finance_collection",
        description: "Contact guardian, confirm collection plan, and update the invoice once resolved.",
        priority: "high",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: user.id,
        studentId: invoice.student_id,
        classroomId: invoice.classroom_id,
        relatedTable: "invoices",
        relatedRecordId: invoice.id,
        metadata: { invoice_number: invoice.invoice_number, amount: invoice.amount, currency: invoice.currency } satisfies Json
      });
    }
    await notifyInvoiceGuardians({
      studentId: invoice.student_id,
      invoiceId: invoice.id,
      title: "Fee invoice overdue",
      body: `${invoice.invoice_number} is overdue. Please contact finance to confirm payment arrangements.`
    });
  }

  if (result.data.intent === "void") {
    if (invoice.status === "paid") return { ok: false, message: "Paid invoices should be refunded or adjusted, not voided here." };
    const { error } = await admin.from("invoices").update({ status: "void" }).eq("id", invoice.id);
    if (error) return { ok: false, message: "The invoice could not be voided." };
    await completeRelatedWorkflowTasks({
      workflowKey: "finance_collection",
      relatedTable: "invoices",
      relatedRecordId: invoice.id
    });
    await closeBatchIfSettled(invoice.billing_batch_id);
    await notifyInvoiceGuardians({
      studentId: invoice.student_id,
      invoiceId: invoice.id,
      title: "Fee invoice voided",
      body: `${invoice.invoice_number} has been voided by the finance office.`
    });
  }

  await admin.from("automation_rules").update({ last_triggered_at: new Date().toISOString() }).eq("event_key", "invoice.class_batch_created");
  revalidatePath("/admin/fees");
  revalidatePath("/finance");
  revalidatePath("/finance/invoices");
  revalidatePath("/finance/collections");
  revalidatePath("/parent");
  revalidatePath("/parent/fees");
  revalidatePath("/admin/student-360");
  revalidatePath(`/admin/student-360/${invoice.student_id}`);
  revalidatePath("/admin/automation");
  return {
    ok: true,
    message: result.data.intent === "mark_paid"
      ? "Invoice marked paid and parent notified."
      : result.data.intent === "mark_overdue"
        ? "Invoice marked overdue and follow-up created."
        : "Invoice voided and follow-up closed."
  };
}
