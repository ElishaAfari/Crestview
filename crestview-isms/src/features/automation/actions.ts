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

const student360NoteSchema = z.object({
  studentId: z.string().uuid(),
  noteType: z.enum(["general", "academic", "attendance", "finance", "wellbeing", "discipline", "parent_contact"]),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(2500),
  visibility: z.enum(["staff", "guardian", "restricted"]),
  createTask: z.string().optional(),
  notifyGuardians: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  dueAt: z.string().optional()
});

function taskNumber(prefix = "TASK") {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function userCanManageStudent(admin: ReturnType<typeof createAdminClient>, userId: string, role: string | null, studentId: string) {
  if (["super_admin", "school_admin", "hr_staff"].includes(role ?? "")) return true;
  if (role !== "teacher") return false;
  const { data: studentData } = await admin.from("students").select("classroom_id").eq("id", studentId).is("deleted_at", null).maybeSingle();
  const student = studentData as { classroom_id: string | null } | null;
  if (!student?.classroom_id) return false;
  const [leadCourses, assignedCourses] = await Promise.all([
    admin
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", userId)
      .eq("classroom_id", student.classroom_id)
      .is("deleted_at", null),
    admin
      .from("teacher_assignments")
      .select("courses!inner(classroom_id)", { count: "exact", head: true })
      .eq("teacher_id", userId)
      .eq("courses.classroom_id", student.classroom_id)
      .is("deleted_at", null)
  ]);
  return Boolean((leadCourses.count ?? 0) + (assignedCourses.count ?? 0));
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

export async function createStudent360NoteAction(_: { ok: boolean; message: string }, formData: FormData) {
  const result = student360NoteSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    noteType: String(formData.get("noteType") ?? "general"),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    visibility: String(formData.get("visibility") ?? "staff"),
    createTask: String(formData.get("createTask") ?? ""),
    notifyGuardians: String(formData.get("notifyGuardians") ?? ""),
    priority: String(formData.get("priority") ?? "normal"),
    dueAt: String(formData.get("dueAt") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the intervention note." };

  const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher", "hr_staff"]);
  const admin = createAdminClient();
  if (!(await userCanManageStudent(admin, user.id, role, result.data.studentId))) {
    return { ok: false, message: "You can only add notes for learners in your permitted workspace." };
  }

  const { data: studentData } = await admin
    .from("students")
    .select("id,student_number,classroom_id,profiles!students_profile_id_fkey(first_name,last_name)")
    .eq("id", result.data.studentId)
    .is("deleted_at", null)
    .maybeSingle();
  const student = studentData as unknown as {
    id: string;
    student_number: string;
    classroom_id: string | null;
    profiles: { first_name: string; last_name: string } | Array<{ first_name: string; last_name: string }> | null;
  } | null;
  if (!student) return { ok: false, message: "The learner could not be found." };
  const profile = Array.isArray(student.profiles) ? student.profiles[0] ?? null : student.profiles;
  const studentName = profile ? `${profile.first_name} ${profile.last_name}` : student.student_number;

  const { data: noteData, error } = await admin
    .from("student_360_notes")
    .insert({
      student_id: result.data.studentId,
      note_type: result.data.noteType,
      title: result.data.title,
      body: result.data.body,
      visibility: result.data.visibility,
      created_by: user.id,
      metadata: {
        source: "student_360_detail",
        task_requested: Boolean(result.data.createTask),
        guardian_notice_requested: Boolean(result.data.notifyGuardians)
      } satisfies Json
    })
    .select("id")
    .single();
  const noteId = (noteData as { id: string } | null)?.id;
  if (error || !noteId) return { ok: false, message: "The note could not be saved." };

  if (result.data.createTask) {
    const workflowKey = result.data.noteType === "attendance"
      ? "attendance_follow_up"
      : result.data.noteType === "finance"
        ? "finance_collection"
        : "academic_follow_up";
    await createWorkflowTask({
      title: `${result.data.title} - ${studentName}`,
      workflowKey,
      description: result.data.body,
      priority: result.data.priority,
      dueAt: result.data.dueAt ? new Date(result.data.dueAt).toISOString() : null,
      assignedTo: user.id,
      createdBy: user.id,
      studentId: result.data.studentId,
      classroomId: student.classroom_id,
      relatedTable: "student_360_notes",
      relatedRecordId: noteId,
      metadata: { note_type: result.data.noteType, visibility: result.data.visibility } satisfies Json
    });
  }

  if (result.data.notifyGuardians && result.data.visibility === "guardian") {
    const { data: parentLinks } = await admin
      .from("parent_students")
      .select("parent_profile_id")
      .eq("student_id", result.data.studentId)
      .is("deleted_at", null);
    const recipients = Array.from(new Set(((parentLinks ?? []) as Array<{ parent_profile_id: string }>).map((link) => link.parent_profile_id)));
    if (recipients.length) {
      await admin.from("notifications").insert(recipients.map((recipientId) => ({
        recipient_id: recipientId,
        title: result.data.title,
        body: result.data.body,
        type: "student_support",
        metadata: { student_id: result.data.studentId, student_360_note_id: noteId, note_type: result.data.noteType } satisfies Json
      })));
    }
  }

  revalidatePath("/admin/student-360");
  revalidatePath(`/admin/student-360/${result.data.studentId}`);
  revalidatePath("/teacher/student-360");
  revalidatePath(`/teacher/student-360/${result.data.studentId}`);
  revalidatePath("/admin/automation");
  revalidatePath("/parent");
  revalidatePath("/student");
  return { ok: true, message: result.data.createTask ? "Note saved and follow-up task created." : "Note saved." };
}
