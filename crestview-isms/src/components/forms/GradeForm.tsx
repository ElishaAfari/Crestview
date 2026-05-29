"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gradeSchema } from "@/lib/validations/grade.schema";

type GradeFormValues = { gradeItemId: string; studentId: string; score: number; comments?: string };

export function GradeForm() {
  const form = useForm<GradeFormValues>();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: GradeFormValues) {
    const result = gradeSchema.safeParse(values);
    setMessage(result.success ? "Grade is ready to publish." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>Grade item ID</Label><Input {...form.register("gradeItemId")} /></div>
      <div><Label>Student ID</Label><Input {...form.register("studentId")} /></div>
      <div><Label>Score</Label><Input type="number" {...form.register("score", { valueAsNumber: true })} /></div>
      <div><Label>Comments</Label><Input {...form.register("comments")} /></div>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">Save grade</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
