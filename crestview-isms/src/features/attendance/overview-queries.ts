import "server-only";

import { ADMIN_ROLES } from "@/config/roles";
import { requireRoles } from "@/features/auth/guards";
import { getStaffClockBoard } from "@/features/staff/clock-queries";
import { createAdminClient } from "@/lib/supabase/admin";

export type AttendanceOverview = {
  date: string;
  studentTotals: {
    enrolled: number;
    marked: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  staffTotals: {
    total: number;
    clockedIn: number;
    completed: number;
    pending: number;
  };
  classrooms: Array<{
    id: string;
    label: string;
    enrolled: number;
    marked: number;
    status: "Marked" | "Not marked";
  }>;
};

type Classroom = { id: string; name: string; grade_level: string | null };
type Student = { classroom_id: string | null };
type AttendanceRecord = { classroom_id: string | null; status: string };

function classroomLabel(classroom: Classroom) {
  return classroom.grade_level && classroom.grade_level !== classroom.name
    ? `${classroom.grade_level} - ${classroom.name}`
    : classroom.name;
}

export async function getAttendanceOverview(): Promise<AttendanceOverview> {
  await requireRoles(ADMIN_ROLES);
  const admin = createAdminClient();
  const date = new Date().toISOString().slice(0, 10);
  const [classroomsResult, studentsResult, recordsResult, staffBoard] =
    await Promise.all([
      admin
        .from("classrooms")
        .select("id,name,grade_level")
        .is("deleted_at", null)
        .order("grade_level"),
      admin
        .from("students")
        .select("classroom_id")
        .eq("status", "active")
        .is("deleted_at", null),
      admin
        .from("attendance_records")
        .select("classroom_id,status")
        .eq("attendance_date", date)
        .is("deleted_at", null),
      getStaffClockBoard(date),
    ]);

  const classrooms = (classroomsResult.data ?? []) as Classroom[];
  const students = (studentsResult.data ?? []) as Student[];
  const records = (recordsResult.data ?? []) as AttendanceRecord[];
  const enrolledByClassroom = new Map<string, number>();
  const markedByClassroom = new Map<string, number>();

  for (const student of students) {
    if (!student.classroom_id) continue;
    enrolledByClassroom.set(
      student.classroom_id,
      (enrolledByClassroom.get(student.classroom_id) ?? 0) + 1,
    );
  }
  for (const record of records) {
    if (!record.classroom_id) continue;
    markedByClassroom.set(
      record.classroom_id,
      (markedByClassroom.get(record.classroom_id) ?? 0) + 1,
    );
  }

  const present = records.filter(
    (record) => record.status === "present" || record.status === "late",
  ).length;
  const absent = records.filter((record) => record.status === "absent").length;
  const late = records.filter((record) => record.status === "late").length;

  return {
    date,
    studentTotals: {
      enrolled: students.length,
      marked: records.length,
      present,
      absent,
      late,
      rate: records.length ? Math.round((present / records.length) * 100) : 0,
    },
    staffTotals: {
      total: staffBoard.total,
      clockedIn: staffBoard.clockedIn,
      completed: staffBoard.completed,
      pending: staffBoard.pending,
    },
    classrooms: classrooms.map((classroom) => {
      const marked = markedByClassroom.get(classroom.id) ?? 0;
      return {
        id: classroom.id,
        label: classroomLabel(classroom),
        enrolled: enrolledByClassroom.get(classroom.id) ?? 0,
        marked,
        status: marked > 0 ? "Marked" : "Not marked",
      };
    }),
  };
}
