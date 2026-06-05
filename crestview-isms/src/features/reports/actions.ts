"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const reportSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  term: z.string().min(3),
  summary: z.string().min(10).max(2000)
});

export async function generateReportAction(formData: FormData) {
  const result = reportSchema.safeParse({
    studentId: String(formData.get("studentId") ?? ""),
    academicYearId: String(formData.get("academicYearId") ?? ""),
    term: String(formData.get("term") ?? ""),
    summary: String(formData.get("summary") ?? "")
  });

  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check the report details." };

  const { user } = await requireRoles(["super_admin", "school_admin", "teacher"]);
  const admin = createAdminClient();
  const { error } = await admin.from("reports").insert({
    student_id: result.data.studentId,
    academic_year_id: result.data.academicYearId,
    term: result.data.term.trim(),
    summary: result.data.summary.trim(),
    generated_by: user.id
  });

  if (error) return { ok: false, message: "The report could not be generated." };
  revalidatePath("/admin/reports");
  return { ok: true, message: "Report generated and saved for the student workspace." };
}
