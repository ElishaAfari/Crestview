"use client";

import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { importGradesCsvAction } from "@/features/grades/actions";
import type { SelectOption } from "@/features/admin/queries";

function csvEscape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function studentNumberFromLabel(label: string) {
  return label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "";
}

export function GradeImportForm({ gradeItems = [], students = [] }: { gradeItems?: SelectOption[]; students?: SelectOption[] }) {
  const [gradeItemId, setGradeItemId] = useState(gradeItems[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });

  const templateHref = useMemo(() => {
    const rows = [
      ["student_number", "student_name", "score", "comments"],
      ...students.map((student) => [
        studentNumberFromLabel(student.label),
        student.label.replace(/\s*\([^)]+\)\s*$/, ""),
        "",
        ""
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [students]);

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
          <Label>Assessment</Label>
          <Select value={gradeItemId} onChange={(event) => setGradeItemId(event.target.value)}>
            <option value="">Choose assessment</option>
            {gradeItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
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
    </div>
  );
}
