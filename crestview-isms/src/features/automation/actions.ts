"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles, requireUser } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export type WorkflowTaskInput = {
  title: string;
  workflowKey: string;
  description?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  dueAt?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  studentId?: string | null;
  parentProfileId?: string | null;
  staffProfileId?: string | null;
  classroomId?: string | null;
  relatedTable?: string | null;
  relatedRecordId?: string | null;
  metadata?: Json;
};

const taskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "blocked", "completed", "cancelled"])
});

const manualTaskSchema = z.object({
  title: z.string().trim().min(3).max(180),
  workflowKey: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1200).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  dueAt: z.string().optional(),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  studentId: z.string().uuid().optional().or(z.literal("")),
  classroomId: z.string().uuid().optional().or(z.literal(""))
});

function taskNumber(prefix = "TASK") {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createWorkflowTask(input: WorkflowTaskInput) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workflow_tasks")
    .insert({
      task_number: taskNumber(),
      title: input.title,
      description: input.description ?? null,
      workflow_key: input.workflowKey,
      priority: input.priority ?? "normal",
      due_at: input.dueAt ?? null,
      assigned_to: input.assignedTo ?? null,
      created_by: input.createdBy ?? null,
      student_id: input.studentId ?? null,
      parent_profile_id: input.parentProfileId ?? null,
      staff_profile_id: input.staffProfileId ?? null,
      classroom_id: input.classroomId ?? null,
      related_table: input.relatedTable ?? null,
      related_record_id: input.relatedRecordId ?? null,
      metadata: input.metadata ?? {}
    })
    .select("id")
    .single();

  return error ? null : ((data as { id: string } | null)?.id ?? null);
}

export async function completeRelatedWorkflowTasks({
  workflowKey,
  relatedTable,
  relatedRecordId
}: {
  workflowKey: string;
  relatedTable: string;
  relatedRecordId: string;
}) {
  const admin = createAdminClient();
  await admin
    .from("workflow_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("workflow_key", workflowKey)
    .eq("related_table", relatedTable)
    .eq("related_record_id", relatedRecordId)
    .in("status", ["open", "in_progress", "blocked"]);
}

export async function createManualWorkflowTaskAction(_: { ok: boolean; message: string }, formData: FormData) {
  const result = manualTaskSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    workflowKey: String(formData.get("workflowKey") ?? "general"),
    description: String(formData.get("description") ?? ""),
    priority: String(formData.get("priority") ?? "normal"),
    dueAt: String(formData.get("dueAt") ?? ""),
    assignedTo: String(formData.get("assignedTo") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    classroomId: String(formData.get("classroomId") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the task details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff", "finance_officer", "librarian", "it_support"]);
  const id = await createWorkflowTask({
    title: result.data.title,
    workflowKey: result.data.workflowKey,
    description: result.data.description || null,
    priority: result.data.priority,
    dueAt: result.data.dueAt || null,
    assignedTo: result.data.assignedTo || null,
    createdBy: user.id,
    studentId: result.data.studentId || null,
    classroomId: result.data.classroomId || null,
    metadata: { source: "manual_portal_task" }
  });

  revalidatePath("/admin/automation");
  revalidatePath("/teacher");
  revalidatePath("/hr");
  revalidatePath("/finance");
  revalidatePath("/library");
  revalidatePath("/it");
  return id ? { ok: true, message: "Workflow task created." } : { ok: false, message: "The workflow task could not be created." };
}

export async function updateWorkflowTaskStatusAction(_: { ok: boolean; message: string }, formData: FormData) {
  const result = taskStatusSchema.safeParse({
    taskId: String(formData.get("taskId") ?? ""),
    status: String(formData.get("status") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Choose a valid task status." };

  const { user } = await requireUser();
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    status: result.data.status,
    completed_at: result.data.status === "completed" ? new Date().toISOString() : null
  };
  if (result.data.status === "in_progress") updatePayload.assigned_to = user.id;
  const { error } = await admin
    .from("workflow_tasks")
    .update(updatePayload)
    .eq("id", result.data.taskId);

  revalidatePath("/admin/automation");
  revalidatePath("/hr");
  revalidatePath("/finance");
  revalidatePath("/library");
  revalidatePath("/it");
  return error ? { ok: false, message: "The task could not be updated." } : { ok: true, message: "Task updated." };
}
