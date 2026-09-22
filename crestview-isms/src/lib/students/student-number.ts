import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const STUDENT_NUMBER_PATTERN = /^Stu\d{6}$/;

export function normalizeStudentNumber(value: string) {
  const trimmed = value.trim();
  const compact = trimmed.match(/^stu\s*-?\s*(\d{6})$/i);
  return compact ? `Stu${compact[1]}` : trimmed;
}

export function isSupportedStudentNumber(value: string) {
  return STUDENT_NUMBER_PATTERN.test(normalizeStudentNumber(value));
}

export async function generateStudentNumber(admin: ReturnType<typeof createAdminClient>) {
  const { data: sequenceNumber, error: sequenceError } = await admin.rpc("next_student_number");
  if (!sequenceError && typeof sequenceNumber === "string" && isSupportedStudentNumber(sequenceNumber)) {
    return normalizeStudentNumber(sequenceNumber);
  }

  // Compatibility fallback for a deployment before the sequence migration is applied.
  const { data: existing } = await admin.from("students").select("student_number").like("student_number", "Stu%");
  const highest = (existing ?? []).reduce((max, row) => {
    const match = String((row as { student_number?: string }).student_number ?? "").match(/^Stu(\d{6})$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  for (let attempt = highest + 1; attempt <= 999999; attempt += 1) {
    const candidate = `Stu${String(attempt).padStart(6, "0")}`;
    const { count, error } = await admin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("student_number", candidate);
    if (error) throw new Error("Could not verify the next student ID.");
    if ((count ?? 0) === 0) return candidate;
  }
  throw new Error("Could not generate a unique student ID. Please try again.");
}
