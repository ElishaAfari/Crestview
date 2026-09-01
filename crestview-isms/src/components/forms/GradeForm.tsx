"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { publishGradeAction } from "@/features/grades/actions";
import type { SelectOption } from "@/features/admin/queries";

type GradeFormValues = { gradeItemId: string; studentId: string; score: number; comments?: string };

export function GradeForm({ gradeItems = [], students = [] }: { gradeItems?: SelectOption[]; students?: SelectOption[] }) {
  const form = useForm<GradeFormValues>({ defaultValues: { gradeItemId: gradeItems[0]?.id ?? "", studentId: students[0]?.id ?? "" } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: GradeFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await publishGradeAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ gradeItemId: gradeItems[0]?.id ?? "", studentId: students[0]?.id ?? "" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <SearchableSelect label="Assessment" options={gradeItems} placeholder="Choose assessment" searchPlaceholder="Search assessment, class, subject..." {...form.register("gradeItemId")} />
      <SearchableSelect label="Student" options={students} placeholder="Choose student" searchPlaceholder="Search name or student ID..." {...form.register("studentId")} />
      <div><Label>Score</Label><Input type="number" {...form.register("score", { valueAsNumber: true })} /></div>
      <div><Label>Comments</Label><Input {...form.register("comments")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save grade"}</Button>{message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
