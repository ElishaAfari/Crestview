"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignmentSchema } from "@/lib/validations/assignment.schema";

export async function createAssignmentAction(formData: FormData) {
  const dueAt = String(formData.get("dueAt") ?? "");
  const result = assignmentSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    maxScore: String(formData.get("maxScore") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the assignment details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const { error } = await admin.from("assignments").insert({
    course_id: result.data.courseId,
    title: result.data.title.trim(),
    description: result.data.description?.trim() || null,
    due_at: result.data.dueAt ?? null,
    max_score: result.data.maxScore,
    created_by: user.id
  });

  if (error) return { ok: false, message: "The assignment could not be created. Check the course and your access level." };
  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
  return { ok: true, message: "Assignment created." };
}
