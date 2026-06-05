"use server";

import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSchema } from "@/lib/validations/grade.schema";

export async function publishGradeAction(formData: FormData) {
  const result = gradeSchema.safeParse({
    gradeItemId: String(formData.get("gradeItemId") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    score: String(formData.get("score") ?? ""),
    comments: String(formData.get("comments") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the grade details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const { error } = await admin.from("grades").upsert({
    grade_item_id: result.data.gradeItemId,
    student_id: result.data.studentId,
    score: result.data.score,
    comments: result.data.comments?.trim() || null,
    graded_by: user.id
  }, { onConflict: "grade_item_id,student_id" });

  return error
    ? { ok: false, message: "The grade could not be saved. Check the assessment, student, and your access level." }
    : { ok: true, message: "Grade saved." };
}
