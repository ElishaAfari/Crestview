import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const STAFF_NUMBER_PATTERN = /^CIS\/STA\d{4}$/;

export function normalizeStaffNumber(value: string) {
  const match = value.trim().match(/^cis\s*[\/-]?\s*sta\s*[\/-]?\s*(\d{1,4})$/i);
  return match ? `CIS/STA${match[1].padStart(4, "0")}` : value.trim();
}

export function isSupportedStaffNumber(value: string) {
  return STAFF_NUMBER_PATTERN.test(normalizeStaffNumber(value));
}

export async function generateStaffNumber(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin.rpc("next_staff_number");
  if (!error && typeof data === "string" && isSupportedStaffNumber(data)) return normalizeStaffNumber(data);

  const { data: staff, error: staffError } = await admin
    .from("staff_profiles")
    .select("staff_number")
    .like("staff_number", "CIS/STA%");
  if (staffError) throw new Error("Could not allocate the next staff ID.");
  const highest = (staff ?? []).reduce((max, row) => {
    const match = String((row as { staff_number?: string }).staff_number ?? "").match(/^CIS\/STA(\d{4})$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  for (let value = highest + 1; value <= 9999; value += 1) {
    const candidate = `CIS/STA${String(value).padStart(4, "0")}`;
    const { count, error: countError } = await admin.from("staff_profiles").select("id", { count: "exact", head: true }).eq("staff_number", candidate);
    if (countError) throw new Error("Could not verify the next staff ID.");
    if (!count) return candidate;
  }
  throw new Error("Staff ID capacity has been reached.");
}
