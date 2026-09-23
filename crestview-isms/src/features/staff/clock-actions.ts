"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminRole } from "@/config/roles";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeStaffNumber } from "@/lib/staff/staff-number";
import type { Json } from "@/types/database.types";

const staffRoles = [
  "super_admin",
  "school_owner",
  "school_admin",
  "teacher",
  "hr_staff",
  "finance_officer",
  "librarian",
  "it_support",
] as const;
const clockSchema = z.object({
  staffLookup: z.string().trim().min(4).max(160),
  direction: z.enum(["in", "out"]),
  attendanceDate: z.string().date(),
  source: z.enum(["qr", "manual"]),
});

type Relation<T> = T | T[] | null;
function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

async function findStaffByLookup(
  admin: ReturnType<typeof createAdminClient>,
  lookup: string,
) {
  const raw = lookup.trim();
  const normalized = normalizeStaffNumber(raw);
  const { data: cardData } = await admin
    .from("staff_id_cards")
    .select("staff_profile_id")
    .eq("qr_payload", raw)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  const card = cardData as { staff_profile_id: string | null } | null;
  let query = admin
    .from("staff_profiles")
    .select(
      "id,profile_id,staff_number,job_title,profiles(first_name,last_name)",
    )
    .is("deleted_at", null);
  query = card?.staff_profile_id
    ? query.eq("id", card.staff_profile_id)
    : query.eq("staff_number", normalized);
  return (await query.maybeSingle()).data as unknown as {
    id: string;
    profile_id: string;
    staff_number: string;
    job_title: string | null;
    profiles: Relation<{ first_name: string; last_name: string }>;
  } | null;
}

export async function clockStaffAttendanceAction(formData: FormData) {
  const result = clockSchema.safeParse({
    staffLookup: String(formData.get("staffLookup") ?? ""),
    direction: String(formData.get("direction") ?? "in"),
    attendanceDate: String(formData.get("attendanceDate") ?? ""),
    source: String(formData.get("source") ?? "manual"),
  });
  if (!result.success)
    return {
      ok: false,
      message:
        "Scan or enter a valid staff ID, then choose clock in or clock out.",
    };

  const { user, role } = await requireRoles([...staffRoles]);
  const admin = createAdminClient();
  const staff = await findStaffByLookup(admin, result.data.staffLookup);
  if (!staff)
    return {
      ok: false,
      message: "No active staff member matched that staff ID or QR card.",
    };
  if (!isAdminRole(role) && staff.profile_id !== user.id)
    return { ok: false, message: "Staff can only clock their own ID card." };

  const { data: existingData } = await admin
    .from("staff_attendance_records")
    .select("id,clock_in_at,clock_out_at,metadata")
    .eq("staff_profile_id", staff.id)
    .eq("attendance_date", result.data.attendanceDate)
    .is("deleted_at", null)
    .maybeSingle();
  const existing = existingData as {
    id: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    metadata: Json | null;
  } | null;
  const now = new Date().toISOString();
  const profile = one(staff.profiles);
  const name = profile
    ? `${profile.first_name} ${profile.last_name}`
    : staff.staff_number;
  const metadata =
    existing?.metadata &&
    typeof existing.metadata === "object" &&
    !Array.isArray(existing.metadata)
      ? existing.metadata
      : {};

  if (result.data.direction === "in") {
    if (existing?.clock_in_at)
      return { ok: true, message: `${name} is already clocked in today.` };
    const payload = {
      staff_profile_id: staff.id,
      attendance_date: result.data.attendanceDate,
      status: "present",
      clock_in_at: now,
      recorded_by: user.id,
      metadata: {
        ...metadata,
        clock_in: {
          source: result.data.source,
          staff_number: staff.staff_number,
          at: now,
        },
      } satisfies Json,
    };
    const { error } = existing
      ? await admin
          .from("staff_attendance_records")
          .update(payload)
          .eq("id", existing.id)
      : await admin.from("staff_attendance_records").insert(payload);
    if (error)
      return { ok: false, message: "Staff clock-in could not be saved." };
  } else {
    if (!existing?.clock_in_at)
      return {
        ok: false,
        message: "Clock in must be recorded before clocking out.",
      };
    if (existing.clock_out_at)
      return { ok: true, message: `${name} is already clocked out today.` };
    const { error } = await admin
      .from("staff_attendance_records")
      .update({
        clock_out_at: now,
        recorded_by: user.id,
        metadata: {
          ...metadata,
          clock_out: {
            source: result.data.source,
            staff_number: staff.staff_number,
            at: now,
          },
        } satisfies Json,
      })
      .eq("id", existing.id);
    if (error)
      return { ok: false, message: "Staff clock-out could not be saved." };
  }

  revalidatePath("/staff-clock");
  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/hr");
  return {
    ok: true,
    message: `${name} clocked ${result.data.direction} at ${new Intl.DateTimeFormat("en-GH", { timeStyle: "short" }).format(new Date(now))}.`,
  };
}
