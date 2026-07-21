import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
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

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scoreText(value: unknown) {
  const score = numberValue(value);
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
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

function wrapPdfText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = `${line} ${word}`.trim();
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
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
  const tableRows = rows.map((item) => {
    const row = asRecord(item);
    return {
      subject: text(row.subject, "Subject"),
      assignment: numberValue(row.assignment),
      quiz: numberValue(row.quiz),
      midterm: numberValue(row.midterm),
      classAssessment: numberValue(row.classAssessment),
      exam: numberValue(row.exam),
      total: numberValue(row.total),
      gradeCode: text(row.gradeCode, "-"),
      remark: text(row.remark, "-")
    };
  });

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.02, 0.11, 0.28);
  const blue = rgb(0.02, 0.22, 0.62);
  const borderBlue = rgb(0.42, 0.62, 0.88);
  const paleBlue = rgb(0.9, 0.95, 1);
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
      page.drawText(line, { x: indent, y, size, font, color: options.color ?? navy });
      y -= size + 6;
    }
  }

  function drawResultsHeader(columns: ReadonlyArray<{ label: string; width: number }>, left: number, rowHeight: number) {
    page.drawRectangle({ x: left, y: y - rowHeight + 6, width: columns.reduce((sum, column) => sum + column.width, 0), height: rowHeight, color: paleBlue, borderColor: borderBlue, borderWidth: 0.8 });
    let x = left;
    for (const column of columns) {
      page.drawRectangle({ x, y: y - rowHeight + 6, width: column.width, height: rowHeight, borderColor: borderBlue, borderWidth: 0.6 });
      const lines = wrapPdfText(column.label, bold, 7.2, column.width - 8).slice(0, 2);
      lines.forEach((line, index) => page.drawText(line, { x: x + 4, y: y - 9 - (index * 9), size: 7.2, font: bold, color: blue }));
      x += column.width;
    }
    y -= rowHeight;
  }

  function drawResultsTable(dataRows: typeof tableRows) {
    const left = 36;
    const columns = [
      { key: "subject", label: "Subject", width: 126 },
      { key: "assignment", label: "Assignment /10", width: 50 },
      { key: "quiz", label: "Quiz /10", width: 45 },
      { key: "midterm", label: "Midterm /10", width: 54 },
      { key: "classAssessment", label: "CA /30", width: 48 },
      { key: "exam", label: "Exam /70", width: 50 },
      { key: "total", label: "Total /100", width: 54 },
      { key: "gradeCode", label: "Grade", width: 42 },
      { key: "remark", label: "Remark", width: 54 }
    ] as const;
    const headerHeight = 32;
    drawResultsHeader(columns, left, headerHeight);

    for (const row of dataRows) {
      const subjectLines = wrapPdfText(row.subject, bold, 8.2, columns[0].width - 8).slice(0, 2);
      const remarkLines = wrapPdfText(row.remark, regular, 7.8, columns[8].width - 8).slice(0, 2);
      const rowHeight = Math.max(34, Math.max(subjectLines.length, remarkLines.length) * 9 + 16);
      if (y - rowHeight < 52) {
        page = pdf.addPage([595, 842]);
        y = 800;
        page.drawText("Subject Performance Continued", { x: left, y, size: 11, font: bold, color: blue });
        y -= 18;
        drawResultsHeader(columns, left, headerHeight);
      }

      let x = left;
      page.drawRectangle({ x: left, y: y - rowHeight + 6, width: columns.reduce((sum, column) => sum + column.width, 0), height: rowHeight, borderColor: borderBlue, borderWidth: 0.6 });
      for (const column of columns) {
        page.drawRectangle({ x, y: y - rowHeight + 6, width: column.width, height: rowHeight, borderColor: borderBlue, borderWidth: 0.35 });
        const rawValue = row[column.key];
        const value = typeof rawValue === "number" ? scoreText(rawValue) : String(rawValue);
        const font = column.key === "subject" || column.key === "total" || column.key === "gradeCode" ? bold : regular;
        const size = column.key === "subject" ? 8.2 : 7.8;
        const cellLines = (column.key === "subject" ? subjectLines : column.key === "remark" ? remarkLines : wrapPdfText(value, font, size, column.width - 8)).slice(0, 2);
        cellLines.forEach((line, index) => page.drawText(line, { x: x + 4, y: y - 9 - (index * 9), size, font, color: navy }));
        x += column.width;
      }
      y -= rowHeight;
    }
  }

  page.drawText("CRESTVIEW INTERNATIONAL SCHOOL", { x: 42, y, size: 17, font: bold, color: blue });
  y -= 24;
  page.drawText("End of Term Academic Report", { x: 42, y, size: 14, font: bold, color: rgb(0.86, 0.04, 0.12) });
  y -= 26;
  draw(`Student: ${studentName}    ID: ${student?.student_number ?? text(gradeSummary.student_number, "N/A")}`, { strong: true });
  draw(`Class: ${text(gradeSummary.classroom, "Unassigned")}    Academic year: ${text(one(report.academic_years)?.name, text(gradeSummary.academic_year, "Academic year"))}    Term: ${report.term}`, { strong: true });
  draw(`Position: ${text(gradeSummary.position_label, text(analysis.positionLabel, "Not ranked"))}${numberValue(gradeSummary.class_size, numberValue(analysis.classSize)) ? ` of ${scoreText(numberValue(gradeSummary.class_size, numberValue(analysis.classSize)))}` : ""}    Total marks: ${scoreText(gradeSummary.total_marks)}    Average: ${scoreText(analysis.average)}%`, { strong: true });
  y -= 8;

  draw("Teacher Summary", { size: 12, strong: true, color: blue });
  draw(report.summary ?? "No teacher summary was recorded.");
  y -= 8;

  draw("Subject Performance", { size: 12, strong: true, color: blue });
  draw(`Ranking basis: ${text(gradeSummary.ranking_basis, "Sum of total /100 marks across all recorded subjects in this class for the selected term.")}`, { size: 8.5 });
  y -= 4;
  drawResultsTable(tableRows);
  y -= 8;

  draw("Attendance and Conduct", { size: 12, strong: true, color: blue });
  draw(`Attendance rate: ${numberText(attendance.rate)}% | Present: ${numberText(attendance.present)} | Late: ${numberText(attendance.late)} | Absent: ${numberText(attendance.absent)} | Excused: ${numberText(attendance.excused)}`);
  draw(`Attitude: ${report.attitude ?? text(analysis.attitude, "Not recorded")}`);
  draw(`Punctuality: ${report.punctuality ?? text(analysis.punctuality, "Not recorded")}`);
  y -= 8;

  draw("Automated Analysis", { size: 12, strong: true, color: blue });
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
