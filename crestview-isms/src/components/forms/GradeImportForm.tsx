"use client";

import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { importGradesCsvAction } from "@/features/grades/actions";
import type { GradeImportContext } from "@/features/admin/queries";

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function gradeFormula(totalCell: string) {
  return `=IF(${totalCell}>=75,"A1",IF(${totalCell}>=70,"B2",IF(${totalCell}>=65,"B3",IF(${totalCell}>=60,"C4",IF(${totalCell}>=55,"C5",IF(${totalCell}>=50,"C6",IF(${totalCell}>=45,"D7",IF(${totalCell}>=40,"E8","F9"))))))))`;
}

function remarkFormula(totalCell: string) {
  return `=IF(${totalCell}>=75,"Excellent",IF(${totalCell}>=70,"Very good",IF(${totalCell}>=65,"Good",IF(${totalCell}>=60,"Credit",IF(${totalCell}>=55,"Credit",IF(${totalCell}>=50,"Credit",IF(${totalCell}>=45,"Pass",IF(${totalCell}>=40,"Pass","Needs urgent support"))))))))`;
}

export function GradeImportForm({ contexts = [] }: { contexts?: GradeImportContext[] }) {
  const [gradeItemId, setGradeItemId] = useState(contexts[0]?.gradeItemId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });
  const selectedContext = useMemo(() => contexts.find((context) => context.gradeItemId === gradeItemId) ?? contexts[0], [contexts, gradeItemId]);

  const templateHref = useMemo(() => {
    if (!selectedContext) return "data:text/csv;charset=utf-8,";
    const headerRowNumber = 6;
    const rows = [
      ["CRESTVIEW INTERNATIONAL SCHOOL"],
      ["END OF TERM GRADING REPORT"],
      ["Subject/Course", selectedContext.subjectName],
      ["Class", selectedContext.classroomName, "Term", selectedContext.term, "Assessment", selectedContext.assessmentTitle],
      ["Fill assignment_10, quiz_10, midterm_10, and end_term_exam_70 only. Formula columns calculate the 30/70 total, grade, and remark."],
      [
        "student_number",
        "student_name",
        "classroom",
        "subject",
        "term",
        "assignment_10",
        "quiz_10",
        "midterm_10",
        "class_assessment_30",
        "end_term_exam_70",
        "total_100",
        "grade",
        "remark",
        "teacher_comment"
      ],
      ...selectedContext.students.map((student, index) => {
        const rowNumber = headerRowNumber + index + 1;
        const totalCell = `K${rowNumber}`;
        return [
        student.studentNumber,
        student.name,
        selectedContext.classroomName,
        selectedContext.subjectName,
        selectedContext.term,
        "",
        "",
        "",
        `=SUM(F${rowNumber}:H${rowNumber})`,
        "",
        `=I${rowNumber}+J${rowNumber}`,
        gradeFormula(totalCell),
        remarkFormula(totalCell),
        ""
      ];
      })
    ];
    const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [selectedContext]);

  async function importCsv() {
    if (!file) {
      setState({ ok: false, message: "Choose the completed CSV file first." });
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("gradeItemId", gradeItemId);
    formData.set("file", file);
    const result = await importGradesCsvAction(formData);
    setState(result);
    setPending(false);
    if (result.ok) setFile(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Class subject report</Label>
          <Select value={gradeItemId} onChange={(event) => setGradeItemId(event.target.value)}>
            <option value="">Choose class subject</option>
            {contexts.map((item) => <option key={item.gradeItemId} value={item.gradeItemId}>{item.label}</option>)}
          </Select>
          {selectedContext ? <p className="mt-2 text-xs font-black text-[var(--portal-muted)]">{selectedContext.students.length} active student{selectedContext.students.length === 1 ? "" : "s"} in {selectedContext.classroomName}</p> : null}
        </div>
        <div>
          <Label>Completed CSV file</Label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="portal-field block h-10 w-full rounded-lg px-3 py-2 text-sm font-bold text-[var(--portal-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[#174ea6] file:px-3 file:py-1 file:text-xs file:font-black file:text-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="portal-register-link h-10 px-4 text-sm" download="crestview-grade-template.csv" href={templateHref}>
          <Download className="size-4" aria-hidden />Template
        </a>
        <Button type="button" onClick={importCsv} disabled={pending || !gradeItemId}>
          <Upload className="size-4" aria-hidden />{pending ? "Importing..." : "Import grades"}
        </Button>
      </div>
      {state.message ? <p className={`lg:col-span-2 text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      {selectedContext ? (
        <div className="lg:col-span-2 portal-subtle-card rounded-lg p-3 text-xs font-bold text-[var(--portal-muted)]">
          Template standard: each download is class-specific and already includes the student names and IDs. Teachers fill assignment_10, quiz_10, midterm_10, end_term_exam_70, and optional teacher_comment; formulas and the platform compute the 30% class assessment, 70% exam, total, grade, and remark.
        </div>
      ) : null}
    </div>
  );
}
