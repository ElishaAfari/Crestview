"use client";

import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { importGradesCsvAction } from "@/features/grades/actions";
import type { GradeImportContext } from "@/features/admin/queries";

export function GradeImportForm({ contexts = [] }: { contexts?: GradeImportContext[] }) {
  const [gradeItemId, setGradeItemId] = useState(contexts[0]?.gradeItemId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });
  const selectedContext = useMemo(() => contexts.find((context) => context.gradeItemId === gradeItemId) ?? contexts[0], [contexts, gradeItemId]);

  const templateHref = selectedContext ? `/api/grades/templates/${selectedContext.gradeItemId}` : "#";

  async function importCsv() {
    if (!file) {
      setState({ ok: false, message: "Choose the completed Excel or CSV file first." });
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
          <Label>Completed grade file</Label>
          <input
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="portal-field block h-10 w-full rounded-lg px-3 py-2 text-sm font-bold text-[var(--portal-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[#174ea6] file:px-3 file:py-1 file:text-xs file:font-black file:text-white"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="portal-register-link h-10 px-4 text-sm" href={templateHref} aria-disabled={!selectedContext}>
          <Download className="size-4" aria-hidden />Excel template
        </a>
        <Button type="button" onClick={importCsv} disabled={pending || !gradeItemId}>
          <Upload className="size-4" aria-hidden />{pending ? "Importing..." : "Import grades"}
        </Button>
      </div>
      {state.message ? <p className={`lg:col-span-2 text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      {selectedContext ? (
        <div className="lg:col-span-2 portal-subtle-card rounded-lg p-3 text-xs font-bold text-[var(--portal-muted)]">
          Template standard: download the Excel workbook for a clean class-specific sheet with the student list, merged title rows, frozen headers, score validation, and formula columns. Teachers fill only the yellow input cells; the platform recalculates the 30% class assessment, 70% exam, total, grade, and remark on upload.
        </div>
      ) : null}
    </div>
  );
}
