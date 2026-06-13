import "server-only";

import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export type AcademicPolicySettings = {
  termsPerYear: number;
  classScoreWeight: number;
  examWeight: number;
  gradeScale: string;
  attendanceLocking: string;
};

export async function getAcademicPolicySettings(): Promise<AcademicPolicySettings> {
  await requireRoles(["super_admin", "school_admin"]);
  const admin = createAdminClient();
  const { data } = await admin.from("school_settings").select("value").eq("key", "academic_assessment_policy").maybeSingle();
  const value = (data as { value: Record<string, unknown> | null } | null)?.value ?? {};
  return {
    termsPerYear: Number(value.terms_per_year ?? 3),
    classScoreWeight: Number(value.class_score_weight ?? 40),
    examWeight: Number(value.exam_weight ?? 60),
    gradeScale: String(value.grade_scale ?? "A1-F9"),
    attendanceLocking: String(value.attendance_locking ?? "daily_submitted_register")
  };
}
