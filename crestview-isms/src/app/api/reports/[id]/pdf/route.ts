import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberText(value: unknown, fallback = "0") {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function wrap(value: string, max = 92) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function canReadReport(userId: string, roleName: string, report: { student_id: string | null; classroom_id: string | null; students: Relation<{ profile_id: string | null }> }) {
  if (["super_admin", "school_admin"].includes(roleName)) return true;
  const student = one(report.students);
  if (roleName === "student" && student?.profile_id === userId) return true;
  const admin = createAdminClient();
  if (roleName === "parent" && report.student_id) {
    const { count } = await admin
      .from("parent_students")
      .select("*", { count: "exact", head: true })
      .eq("parent_profile_id", userId)
      .eq("student_id", report.student_id)
      .is("deleted_at", null);
    return Boolean(count);
  }
  if (roleName === "teacher" && report.classroom_id) {
    const [leadCourses, assignedCourses] = await Promise.all([
      admin
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", userId)
        .eq("classroom_id", report.classroom_id)
        .is("deleted_at", null),
      admin
        .from("teacher_assignments")
        .select("courses!inner(classroom_id)", { count: "exact", head: true })
        .eq("teacher_id", userId)
        .eq("courses.classroom_id", report.classroom_id)
        .is("deleted_at", null)
    ]);
    return Boolean((leadCourses.count ?? 0) + (assignedCourses.count ?? 0));
  }
  return false;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profileData } = await admin.from("profiles").select("roles(name)").eq("id", auth.user.id).maybeSingle();
  const roleName = one((profileData as unknown as { roles: Relation<{ name: string }> } | null)?.roles)?.name ?? "";
  const { data } = await admin
    .from("reports")
    .select("id,term,summary,status,published_at,analysis,attendance_summary,grade_summary,attitude,punctuality,next_steps,student_id,classroom_id,students(profile_id,student_number,profiles!students_profile_id_fkey(first_name,last_name)),academic_years(name)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  const report = data as unknown as {
    id: string;
    term: string;
    summary: string | null;
    status: string | null;
    published_at: string | null;
    analysis: unknown;
    attendance_summary: unknown;
    grade_summary: unknown;
    attitude: string | null;
    punctuality: string | null;
    next_steps: string | null;
    student_id: string | null;
    classroom_id: string | null;
    students: Relation<{ profile_id: string | null; student_number: string; profiles: Relation<{ first_name: string; last_name: string }> }>;
    academic_years: Relation<{ name: string }>;
  } | null;
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (!(await canReadReport(auth.user.id, roleName, report))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const student = one(report.students);
  const studentProfile = one(student?.profiles);
  const gradeSummary = asRecord(report.grade_summary);
  const analysis = asRecord(report.analysis);
  const attendance = asRecord(report.attendance_summary);
  const rows = asArray(gradeSummary.rows);
  const studentName = text(gradeSummary.student, studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : "Student");

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;

  function ensure(space: number) {
    if (y - space > 48) return;
    page = pdf.addPage([595, 842]);
    y = 800;
  }

  function draw(value: string, options: { size?: number; strong?: boolean; color?: ReturnType<typeof rgb>; indent?: number } = {}) {
    const size = options.size ?? 10;
    const font = options.strong ? bold : regular;
    const indent = options.indent ?? 42;
    for (const line of wrap(value, size > 12 ? 58 : 94)) {
      ensure(size + 10);
      page.drawText(line, { x: indent, y, size, font, color: options.color ?? rgb(0.02, 0.11, 0.28) });
      y -= size + 6;
    }
  }

  page.drawText("CRESTVIEW INTERNATIONAL SCHOOL", { x: 42, y, size: 17, font: bold, color: rgb(0.02, 0.15, 0.45) });
  y -= 24;
  page.drawText("End of Term Academic Report", { x: 42, y, size: 14, font: bold, color: rgb(0.86, 0.04, 0.12) });
  y -= 26;
  draw(`Student: ${studentName}    ID: ${student?.student_number ?? text(gradeSummary.student_number, "N/A")}`, { strong: true });
  draw(`Class: ${text(gradeSummary.classroom, "Unassigned")}    Academic year: ${text(one(report.academic_years)?.name, text(gradeSummary.academic_year, "Academic year"))}    Term: ${report.term}`, { strong: true });
  y -= 8;

  draw("Teacher Summary", { size: 12, strong: true, color: rgb(0.02, 0.15, 0.45) });
  draw(report.summary ?? "No teacher summary was recorded.");
  y -= 8;

  draw("Subject Performance", { size: 12, strong: true, color: rgb(0.02, 0.15, 0.45) });
  draw("Subject | CA /30 | Exam /70 | Total /100 | Grade | Remark", { strong: true });
  for (const item of rows) {
    const row = asRecord(item);
    draw(`${text(row.subject, "Subject")} | ${numberText(row.classAssessment)} | ${numberText(row.exam)} | ${numberText(row.total)} | ${text(row.gradeCode, "-")} | ${text(row.remark, "-")}`);
  }
  y -= 8;

  draw("Attendance and Conduct", { size: 12, strong: true, color: rgb(0.02, 0.15, 0.45) });
  draw(`Attendance rate: ${numberText(attendance.rate)}% | Present: ${numberText(attendance.present)} | Late: ${numberText(attendance.late)} | Absent: ${numberText(attendance.absent)} | Excused: ${numberText(attendance.excused)}`);
  draw(`Attitude: ${report.attitude ?? text(analysis.attitude, "Not recorded")}`);
  draw(`Punctuality: ${report.punctuality ?? text(analysis.punctuality, "Not recorded")}`);
  y -= 8;

  draw("Automated Analysis", { size: 12, strong: true, color: rgb(0.02, 0.15, 0.45) });
  draw(`Strengths: ${asArray(analysis.strengths).map((item) => text(item)).filter(Boolean).join("; ") || "No strengths recorded."}`);
  draw(`Areas for improvement: ${asArray(analysis.concerns).map((item) => text(item)).filter(Boolean).join("; ") || "No major concern recorded."}`);
  draw(`Recommendations: ${asArray(analysis.recommendations).map((item) => text(item)).filter(Boolean).join("; ") || "Continue the current learning plan."}`);
  draw(`Next steps: ${report.next_steps ?? text(analysis.nextSteps, "Review progress with the class teacher.")}`);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="crestview-${student?.student_number ?? "student"}-${report.term.replaceAll(" ", "-")}-report.pdf"`
    }
  });
}
