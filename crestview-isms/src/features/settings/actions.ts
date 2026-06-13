"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const academicPolicySchema = z.object({
  termsPerYear: z.coerce.number().int().min(1).max(4),
  classScoreWeight: z.coerce.number().min(0).max(100),
  examWeight: z.coerce.number().min(0).max(100),
  gradeScale: z.string().trim().min(2).max(40),
  attendanceLocking: z.string().trim().min(2).max(80)
}).refine((value) => value.classScoreWeight + value.examWeight === 100, "Class score and exam weights must total 100%.");

export async function updateAcademicPolicyAction(formData: FormData) {
  const result = academicPolicySchema.safeParse({
    termsPerYear: String(formData.get("termsPerYear") ?? ""),
    classScoreWeight: String(formData.get("classScoreWeight") ?? ""),
    examWeight: String(formData.get("examWeight") ?? ""),
    gradeScale: String(formData.get("gradeScale") ?? ""),
    attendanceLocking: String(formData.get("attendanceLocking") ?? "")
  });
  if (!result.success) return { ok: false, message: result.error.issues[0]?.message ?? "Check academic policy values." };

  const { user } = await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { error } = await admin.from("school_settings").upsert({
    key: "academic_assessment_policy",
    value: {
      terms_per_year: result.data.termsPerYear,
      class_score_weight: result.data.classScoreWeight,
      exam_weight: result.data.examWeight,
      grade_scale: result.data.gradeScale,
      attendance_locking: result.data.attendanceLocking
    } satisfies Json,
    description: "Crestview academic policy for trimester attendance, grading, and reporting.",
    is_public: false,
    created_by: user.id
  }, { onConflict: "key" });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/grades");
  return error ? { ok: false, message: "Academic policy could not be updated." } : { ok: true, message: "Academic policy updated." };
}
