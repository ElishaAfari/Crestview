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
      <p className="text-xs font-semibold leading-5 text-[var(--portal-muted)]">Required information: student name and class. The importer accepts different column order, comma/semicolon/tab separators, and common headings such as <code>Learner Name</code>, <code>Admission No.</code>, <code>Grade</code>, <code>Sex</code>, and <code>Email Address</code>. External IDs such as <code>STU0826129</code> are preserved in the student record while the platform generates its consistent 8-digit internal ID. Supported class aliases include Creche, Playgroup, Early Year, and Crest 1-7.</p>
      <Button type="submit" disabled={pending}><Upload size={16} aria-hidden />{pending ? "Importing..." : "Import students"}</Button>
      {result ? <div className={`grid gap-2 text-sm font-bold ${result.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}><p>{result.message}</p>{result.errors?.map((error) => <p key={error} className="text-xs font-semibold">{error}</p>)}</div> : null}
    </form>
    <a className="portal-register-link h-fit px-4 py-3 text-sm" download="crestview-student-import-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent("student_id,first_name,middle_name,last_name,date_of_birth,gender,email,phone,address,city,region,admission_date,class_name,section_name,status\nSTU-EXAMPLE,Ama,,Mensah,2018-04-12,female,ama@example.com,0240000000,School Road,Accra,Greater Accra,2026-09-01,Primary 1,A,active\n")}`}>
      Download CSV template
    </a>
  </div>;
}
