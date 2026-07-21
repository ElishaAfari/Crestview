import "server-only";

import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const COMPACT_STUDENT_NUMBER_PATTERN = /^\d{8}$/;

export function normalizeStudentNumber(value: string) {
  return value.trim().toUpperCase();
}

export function isSupportedStudentNumber(value: string) {
  const normalized = normalizeStudentNumber(value);
  return COMPACT_STUDENT_NUMBER_PATTERN.test(normalized) || normalized.startsWith("CIS-");
}

export async function generateStudentNumber(admin: ReturnType<typeof createAdminClient>) {
  const yearPrefix = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = `${yearPrefix}${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
    const { count, error } = await admin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("student_number", candidate);
    if (error) throw new Error("Could not verify the next student ID.");
    if ((count ?? 0) === 0) return candidate;
  }
  throw new Error("Could not generate a unique 8-digit student ID. Please try again.");
}
