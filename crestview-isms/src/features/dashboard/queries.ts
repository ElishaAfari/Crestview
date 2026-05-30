import "server-only";

import { requireUser } from "@/features/auth/guards";

type Relation<T> = T | T[] | null;
type ProfileJoin = { first_name: string; last_name: string };

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function listStudents() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("students").select("id,student_number,status,classrooms(name),profiles(first_name,last_name)").order("student_number");
  const records = (data ?? []) as unknown as Array<{
    id: string;
    student_number: string;
    status: string;
    classrooms: Relation<{ name: string }>;
    profiles: Relation<ProfileJoin>;
  }>;

  return records.map((student) => {
    const profile = one(student.profiles);
    return {
      id: student.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number,
      studentNumber: student.student_number,
      classroom: one(student.classrooms)?.name ?? "Unassigned",
      status: student.status
    };
  });
}

export async function listStaff() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("profiles").select("id,first_name,last_name,phone,roles(name)").order("last_name");
  const records = (data ?? []) as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    roles: Relation<{ name: string }>;
  }>;
  const staffRoles = new Set(["teacher", "hr_staff", "finance_officer", "librarian", "it_support", "school_admin", "super_admin"]);

  return records.flatMap((profile) => {
    const role = one(profile.roles)?.name;
    return role && staffRoles.has(role)
      ? [{ id: profile.id, name: `${profile.first_name} ${profile.last_name}`, role: role.replaceAll("_", " "), phone: profile.phone ?? "Not provided" }]
      : [];
  });
}

export async function listAttendanceRecords() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("attendance_records").select("id,attendance_date,status,students(profiles(first_name,last_name))").order("attendance_date", { ascending: false }).limit(50);
  const records = (data ?? []) as unknown as Array<{
    id: string;
    attendance_date: string;
    status: string;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>;

  return records.map((record) => {
    const profile = one(one(record.students)?.profiles);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      date: record.attendance_date,
      status: record.status
    };
  });
}

export async function listGrades() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("grades").select("id,score,comments,grade_items(title),students(profiles(first_name,last_name))").order("created_at", { ascending: false }).limit(50);
  const records = (data ?? []) as unknown as Array<{
    id: string;
    score: number;
    comments: string | null;
    grade_items: Relation<{ title: string }>;
    students: Relation<{ profiles: Relation<ProfileJoin> }>;
  }>;

  return records.map((record) => {
    const profile = one(one(record.students)?.profiles);
    return {
      id: record.id,
      student: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      assessment: one(record.grade_items)?.title ?? "Assessment",
      score: String(record.score),
      comments: record.comments ?? ""
    };
  });
}
