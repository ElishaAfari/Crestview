import { z } from "zod";

export const directoryFilterSchema = z.object({
  q: z.string().trim().max(120).default(""),
  status: z.enum(["", "active", "graduated", "withdrawn", "suspended"]).default("active"),
  classroom: z.union([z.string().uuid(), z.literal("")]).default(""),
  gender: z.enum(["", "male", "female", "other", "prefer_not_to_say"]).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  view: z.enum(["table", "cards"]).default("table")
});
export type DirectoryFilters = z.infer<typeof directoryFilterSchema>;
export type DirectoryStudent = {
  id: string; student_number: string; name: string; status: string;
  classroom_id: string | null; classroom: string | null; grade_level: string | null;
  gender: string | null; date_of_birth: string | null;
};
export type DirectoryResult = {
  students: DirectoryStudent[]; total: number;
  stats: { total: number; active: number; graduated: number; inactive: number; male: number; female: number };
};
export type SchoolClass = { id: string; name: string; grade_level: string; academic_year_id: string | null; capacity: number };
export type SchoolYear = { id: string; name: string; start_date: string; end_date: string; is_current: boolean };
export type PromotionRun = { id: string; name: string; source_year_id: string; target_year_id: string; status: string; created_at: string; completed_at: string | null };
export type PromotionStudent = { student_id: string; source_classroom_id: string; target_classroom_id: string | null; outcome: string; name: string; student_number: string };

export function parseDirectoryFilters(params: Record<string, string | string[] | undefined>): DirectoryFilters {
  const single = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return directoryFilterSchema.parse(single);
}

export function directoryHref(filters: DirectoryFilters, changes: Partial<DirectoryFilters> = {}) {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) if (value !== "") params.set(key, String(value));
  // An empty status means all students, while an omitted status defaults to active.
  if (next.status === "") params.set("status", "");
  return `/students?${params.toString()}`;
}

export function csvCell(value: string | number | null) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
