import "server-only";

import { isAdminRole } from "@/config/roles";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const staffRoles = ["super_admin", "school_admin", "teacher", "hr_staff", "finance_officer", "librarian", "it_support"] as const;

type Relation<T> = T | T[] | null;
function one<T>(value: Relation<T> | undefined) { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

export type StaffClockBoard = {
  date: string;
  scopeLabel: string;
  total: number;
  clockedIn: number;
  completed: number;
  pending: number;
  rows: Array<{ id: string; staff: string; staffNumber: string; jobTitle: string; clockIn: string; clockOut: string; status: string }>;
};

export async function getStaffClockBoard(): Promise<StaffClockBoard> {
  const { user, role } = await requireRoles([...staffRoles]);
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  let staffQuery = admin
    .from("staff_profiles")
    .select("id,profile_id,staff_number,job_title,profiles(first_name,last_name)")
    .is("deleted_at", null)
    .order("staff_number");
  if (!isAdminRole(role)) staffQuery = staffQuery.eq("profile_id", user.id);
  const { data: staffData } = await staffQuery;
  const staff = (staffData ?? []) as unknown as Array<{
    id: string;
    profile_id: string;
    staff_number: string;
    job_title: string | null;
    profiles: Relation<{ first_name: string; last_name: string }>;
  }>;
  const ids = staff.map((member) => member.id);
  const { data: recordsData } = ids.length
    ? await admin
      .from("staff_attendance_records")
      .select("staff_profile_id,status,clock_in_at,clock_out_at")
      .in("staff_profile_id", ids)
      .eq("attendance_date", today)
      .is("deleted_at", null)
    : { data: [] };
  const records = new Map(((recordsData ?? []) as Array<{
    staff_profile_id: string;
    status: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
  }>).map((record) => [record.staff_profile_id, record]));
  const formatTime = (value: string | null | undefined) => value
    ? new Intl.DateTimeFormat("en-GH", { timeStyle: "short" }).format(new Date(value))
    : "Not recorded";
  const rows = staff.map((member) => {
    const record = records.get(member.id);
    const profile = one(member.profiles);
    return {
      id: member.id,
      staff: profile ? `${profile.first_name} ${profile.last_name}` : member.staff_number,
      staffNumber: member.staff_number,
      jobTitle: member.job_title ?? "Staff member",
      clockIn: formatTime(record?.clock_in_at),
      clockOut: formatTime(record?.clock_out_at),
      status: record?.clock_out_at ? "Completed" : record?.clock_in_at ? "Clocked in" : "Not marked",
    };
  });
  const completed = rows.filter((row) => row.status === "Completed").length;
  const clockedIn = rows.filter((row) => row.status === "Clocked in" || row.status === "Completed").length;
  return {
    date: today,
    scopeLabel: isAdminRole(role) ? "Today’s staff register" : "Your daily clock record",
    total: rows.length,
    clockedIn,
    completed,
    pending: rows.length - clockedIn,
    rows,
  };
}
