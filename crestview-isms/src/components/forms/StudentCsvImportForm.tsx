"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { importStudentsCsvAction } from "@/features/students/actions";
import { Button } from "@/components/ui/button";

export function StudentCsvImportForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string; errors?: string[] } | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setResult(await importStudentsCsvAction(formData));
    setPending(false);
  }
  return <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
    <form action={submit} className="grid gap-4 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-control)] p-5">
      <label className="grid gap-2 text-sm font-black"><span>Student CSV file</span><input name="file" type="file" accept=".csv,text/csv" required className="portal-field rounded-lg border border-[var(--portal-border)] p-3 text-sm" /></label>
      <p className="text-xs font-semibold leading-5 text-[var(--portal-muted)]">Required columns: <code>first_name,last_name,class</code>. Optional columns: <code>student_id,email,enrollment_date,gender,phone</code>. Class names must match a configured classroom.</p>
      <Button type="submit" disabled={pending}><Upload size={16} aria-hidden />{pending ? "Importing..." : "Import students"}</Button>
      {result ? <div className={`grid gap-2 text-sm font-bold ${result.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}><p>{result.message}</p>{result.errors?.map((error) => <p key={error} className="text-xs font-semibold">{error}</p>)}</div> : null}
    </form>
    <a className="portal-register-link h-fit px-4 py-3 text-sm" download="crestview-student-import-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent("first_name,last_name,class,student_id,email,enrollment_date,gender,phone\nAma,Mensah,Primary 1,,ama@example.com,2026-09-01,female,0240000000\n")}`}>
      Download CSV template
    </a>
  </div>;
}
