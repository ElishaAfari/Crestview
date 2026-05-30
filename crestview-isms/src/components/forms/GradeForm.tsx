"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publishGradeAction } from "@/features/grades/actions";

type GradeFormValues = { gradeItemId: string; studentId: string; score: number; comments?: string };

export function GradeForm() {
  const form = useForm<GradeFormValues>();
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: GradeFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await publishGradeAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>Grade item ID</Label><Input {...form.register("gradeItemId")} /></div>
      <div><Label>Student ID</Label><Input {...form.register("studentId")} /></div>
      <div><Label>Score</Label><Input type="number" {...form.register("score", { valueAsNumber: true })} /></div>
      <div><Label>Comments</Label><Input {...form.register("comments")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save grade"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
