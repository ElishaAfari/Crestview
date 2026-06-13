import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireRoles } from "@/features/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Relation<T> = T | T[] | null;

function one<T>(value: Relation<T> | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function safeFilename(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function gradeFormula(totalCell: string) {
  return `IF(${totalCell}>=75,"A1",IF(${totalCell}>=70,"B2",IF(${totalCell}>=65,"B3",IF(${totalCell}>=60,"C4",IF(${totalCell}>=55,"C5",IF(${totalCell}>=50,"C6",IF(${totalCell}>=45,"D7",IF(${totalCell}>=40,"E8","F9"))))))))`;
}

function remarkFormula(totalCell: string) {
  return `IF(${totalCell}>=75,"Excellent",IF(${totalCell}>=70,"Very good",IF(${totalCell}>=65,"Good",IF(${totalCell}>=60,"Credit",IF(${totalCell}>=55,"Credit",IF(${totalCell}>=50,"Credit",IF(${totalCell}>=45,"Pass",IF(${totalCell}>=40,"Pass","Needs urgent support"))))))))`;
}

async function canDownloadTemplate(userId: string, role: string, courseId: string, leadTeacherId: string | null) {
  if (role === "super_admin" || role === "school_admin") return true;
  if (leadTeacherId === userId) return true;
  const admin = createAdminClient();
  const { count } = await admin
    .from("teacher_assignments")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", userId)
    .eq("course_id", courseId)
    .is("deleted_at", null);
  return Boolean(count);
}

export async function GET(_request: Request, context: { params: Promise<{ gradeItemId: string }> }) {
  try {
    const { gradeItemId } = await context.params;
    const { user, role } = await requireRoles(["super_admin", "school_admin", "teacher"]);
    const admin = createAdminClient();

    const { data: gradeItemData } = await admin
      .from("grade_items")
      .select("id,title,course_id,max_score")
      .eq("id", gradeItemId)
      .is("deleted_at", null)
      .maybeSingle();
    const gradeItem = gradeItemData as { id: string; title: string; course_id: string; max_score: number | null } | null;
    if (!gradeItem) return NextResponse.json({ error: "Template context not found." }, { status: 404 });

    const { data: courseData } = await admin
      .from("courses")
      .select("id,classroom_id,teacher_id,academic_year_id,term,subjects(name,code),classrooms(id,name,grade_level,academic_years(name))")
      .eq("id", gradeItem.course_id)
      .is("deleted_at", null)
      .maybeSingle();
    const course = courseData as unknown as {
      id: string;
      classroom_id: string;
      teacher_id: string | null;
      academic_year_id: string | null;
      term: string;
      subjects: Relation<{ name: string; code: string | null }>;
      classrooms: Relation<{ id: string; name: string; grade_level: string; academic_years: Relation<{ name: string }> }>;
    } | null;
    if (!course) return NextResponse.json({ error: "The selected assessment is not linked to a class subject." }, { status: 404 });
    if (!(await canDownloadTemplate(user.id, role, course.id, course.teacher_id))) {
      return NextResponse.json({ error: "You can only download templates for assigned classes." }, { status: 403 });
    }

    const [studentsResult, teacherResult] = await Promise.all([
      admin
        .from("students")
        .select("id,student_number,profiles!students_profile_id_fkey(first_name,last_name)")
        .eq("classroom_id", course.classroom_id)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("student_number"),
      course.teacher_id ? admin.from("profiles").select("first_name,last_name").eq("id", course.teacher_id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    const students = ((studentsResult.data ?? []) as unknown as Array<{
      id: string;
      student_number: string;
      profiles: Relation<{ first_name: string; last_name: string }>;
    }>).map((student) => {
      const profile = one(student.profiles);
      return {
        id: student.id,
        studentNumber: student.student_number,
        name: profile ? `${profile.first_name} ${profile.last_name}` : student.student_number
      };
    });

    const subject = one(course.subjects);
    const classroom = one(course.classrooms);
    const teacher = teacherResult.data as { first_name: string; last_name: string } | null;
    const academicYear = one(classroom?.academic_years)?.name ?? "Current Academic Year";
    const subjectName = subject?.name ?? "Subject";
    const subjectCode = subject?.code ?? subjectName.replace(/\s+/g, "").toUpperCase();
    const className = classroom ? `${classroom.grade_level} - ${classroom.name}` : "Class";
    const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : "Assigned Teacher";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Crestview ISMS";
    workbook.created = new Date();
    workbook.modified = new Date();
    const sheet = workbook.addWorksheet("Grading Report", {
      views: [{ state: "frozen", ySplit: 9, xSplit: 2 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    sheet.properties.defaultRowHeight = 22;
    sheet.columns = [
      { key: "no", width: 7 },
      { key: "student_number", width: 18 },
      { key: "student_name", width: 34 },
      { key: "classroom", width: 20 },
      { key: "subject", width: 18 },
      { key: "term", width: 13 },
      { key: "assignment_10", width: 15 },
      { key: "quiz_10", width: 13 },
      { key: "midterm_10", width: 15 },
      { key: "class_assessment_30", width: 16 },
      { key: "end_term_exam_70", width: 18 },
      { key: "total_100", width: 13 },
      { key: "grade", width: 10 },
      { key: "remark", width: 22 },
      { key: "teacher_comment", width: 36 }
    ];

    const titleRows = [
      ["A2:O2", "CRESTVIEW INTERNATIONAL SCHOOL"],
      ["A3:O3", `${academicYear.toUpperCase()} END OF TERM GRADING REPORT`],
      ["A4:F4", `Subject/Course: ${subjectName}`],
      ["G4:J4", `Subject Code: ${subjectCode}`],
      ["K4:O4", `Assessment: ${gradeItem.title}`],
      ["A5:F5", `Class: ${className}`],
      ["G5:J5", `Term: ${course.term}`],
      ["K5:O5", "Assessment Policy: CA 30% + End of Term Exam 70%"],
      ["A6:O6", `Teacher: ${teacherName}`]
    ] as const;
    for (const [range, value] of titleRows) {
      sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(":")[0]);
      cell.value = value;
      cell.font = { bold: true, size: range === "A2:O2" ? 14 : 12, color: { argb: "FF001B4D" } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    }
    sheet.getRow(2).height = 26;
    sheet.getRow(3).height = 24;
    sheet.getRow(7).height = 10;

    sheet.mergeCells("G8:J8");
    sheet.getCell("G8").value = "Continuous Assessment (30%)";
    sheet.mergeCells("L8:N8");
    sheet.getCell("L8").value = "Final Result";
    sheet.getCell("K8").value = "Examination (70%)";
    sheet.getCell("O8").value = "Teacher Notes";

    const groupHeader = sheet.getRow(8);
    groupHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    groupHeader.alignment = { horizontal: "center", vertical: "middle" };
    groupHeader.height = 24;
    ["G8", "K8", "L8", "O8"].forEach((address) => {
      sheet.getCell(address).fill = { type: "pattern", pattern: "solid", fgColor: { argb: address === "K8" ? "FFDC2626" : "FF174EA6" } };
    });

    const headers = [
      "No.",
      "Student ID",
      "Name",
      "Class",
      "Subject",
      "Term",
      "Assignment",
      "Quiz",
      "Mid Term",
      "CA Mark",
      "ES Mark",
      "Total",
      "Grade",
      "Remark",
      "Teacher Comment"
    ];
    sheet.getRow(9).values = headers;
    sheet.getRow(9).font = { bold: true, color: { argb: "FF000000" } };
    sheet.getRow(9).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    sheet.getRow(9).height = 30;
    sheet.getRow(10).values = ["", "", "", "", "", "", "10%", "10%", "10%", "30%", "70%", "100%", "", "", ""];
    sheet.getRow(10).font = { bold: true, color: { argb: "FF174EA6" } };
    sheet.getRow(10).alignment = { horizontal: "center", vertical: "middle" };

    const firstDataRow = 11;
    const templateRows = Math.max(students.length, 35);
    for (let index = 0; index < templateRows; index += 1) {
      const student = students[index];
      const rowNumber = firstDataRow + index;
      const row = sheet.getRow(rowNumber);
      row.values = [
        index + 1,
        student?.studentNumber ?? "",
        student?.name ?? "",
        className,
        subjectName,
        course.term,
        "",
        "",
        "",
        { formula: `SUM(G${rowNumber}:I${rowNumber})` },
        "",
        { formula: `J${rowNumber}+K${rowNumber}` },
        { formula: gradeFormula(`L${rowNumber}`) },
        { formula: remarkFormula(`L${rowNumber}`) },
        ""
      ];
      row.alignment = { vertical: "middle" };
      row.height = 22;
      ["G", "H", "I", "K", "O"].forEach((column) => {
        sheet.getCell(`${column}${rowNumber}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7CC" } };
      });
      ["J", "L", "M", "N"].forEach((column) => {
        sheet.getCell(`${column}${rowNumber}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FF" } };
        sheet.getCell(`${column}${rowNumber}`).font = { bold: true, color: { argb: "FF174EA6" } };
      });
    }

    sheet.autoFilter = { from: "A9", to: `O${firstDataRow + templateRows - 1}` };
    sheet.getCell("A1").value = "Do not rename header columns. Fill only the yellow score/comment cells, then upload the workbook.";
    sheet.getCell("A1").font = { italic: true, color: { argb: "FFDC2626" } };
    sheet.mergeCells("A1:O1");

    const border = { style: "thin" as const, color: { argb: "FF808080" } };
    for (let row = 2; row <= firstDataRow + templateRows - 1; row += 1) {
      for (let col = 1; col <= 15; col += 1) {
        const cell = sheet.getCell(row, col);
        cell.border = { top: border, left: border, bottom: border, right: border };
      }
    }
    for (let row = 8; row <= 10; row += 1) {
      sheet.getRow(row).eachCell((cell) => {
        cell.fill = cell.fill ?? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FA" } };
      });
    }
    ["A", "B", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].forEach((column) => {
      sheet.getColumn(column).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    sheet.getColumn("C").alignment = { horizontal: "left", vertical: "middle" };
    sheet.getColumn("O").alignment = { horizontal: "left", vertical: "middle", wrapText: true };

    for (let row = firstDataRow; row <= firstDataRow + templateRows - 1; row += 1) {
      ["G", "H", "I"].forEach((column) => {
        sheet.getCell(`${column}${row}`).dataValidation = {
          type: "decimal",
          operator: "between",
          allowBlank: true,
          formulae: [0, 10],
          showErrorMessage: true,
          errorTitle: "Invalid score",
          error: "Assignment, quiz, and mid-term scores must be between 0 and 10."
        };
      });
      sheet.getCell(`K${row}`).dataValidation = {
        type: "decimal",
        operator: "between",
        allowBlank: true,
        formulae: [0, 70],
        showErrorMessage: true,
        errorTitle: "Invalid exam score",
        error: "End-of-term exam score must be between 0 and 70."
      };
    }

    const instructions = workbook.addWorksheet("Instructions");
    instructions.columns = [{ width: 26 }, { width: 96 }];
    instructions.getRow(1).values = ["Crestview Grade Template", "How to use this workbook"];
    instructions.getRow(1).font = { bold: true, size: 14, color: { argb: "FF001B4D" } };
    instructions.addRows([
      ["Step 1", "Use the Grading Report sheet. The student list and IDs are prefilled for the selected class."],
      ["Step 2", "Fill the yellow cells only: Assignment, Quiz, Mid Term, ES Mark, and Teacher Comment."],
      ["Step 3", "CA Mark, Total, Grade, and Remark calculate automatically from the workbook formulas and are recalculated again by the platform on upload."],
      ["Step 4", "Save the workbook as .xlsx and upload it back through the Subject Grade Import panel."],
      ["Limits", "Assignment <= 10, Quiz <= 10, Mid Term <= 10, End of Term Exam <= 70."]
    ]);
    instructions.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = { top: border, left: border, bottom: border, right: border };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `crestview-${safeFilename(className)}-${safeFilename(subjectName)}-${safeFilename(course.term)}-grading-template.xlsx`;
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template generation failed.";
    const status = message.includes("Authentication") ? 401 : message.includes("permission") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
