"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateReportAction } from "@/features/reports/actions";
import type { SelectOption } from "@/features/admin/queries";

type ReportFormValues = { studentId: string; academicYearId: string; term: string; summary: string };

export function ReportForm({ academicYears = [], students = [] }: { academicYears?: SelectOption[]; students?: SelectOption[] }) {
  const form = useForm<ReportFormValues>({
    defaultValues: {
      academicYearId: academicYears[0]?.id ?? "",
      studentId: students[0]?.id ?? "",
      term: "Term 1"
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: ReportFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await generateReportAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ academicYearId: academicYears[0]?.id ?? "", studentId: students[0]?.id ?? "", term: "Term 1", summary: "" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Student</Label>
        <Select {...form.register("studentId")}>
          <option value="">Choose student</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Academic year</Label>
        <Select {...form.register("academicYearId")}>
          <option value="">Choose year</option>
          {academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
        </Select>
      </div>
      <div><Label>Term</Label><Input {...form.register("term")} /></div>
      <div className="sm:col-span-2"><Label>Summary</Label><Textarea {...form.register("summary")} placeholder="Academic progress, attendance notes, strengths, concerns, and next steps." /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <FilePlus2 className="size-4" aria-hidden />{form.formState.isSubmitting ? "Generating..." : "Generate report"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
