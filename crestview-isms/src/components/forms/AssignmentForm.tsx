"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAssignmentAction } from "@/features/assignments/actions";

type AssignmentFormValues = { courseId: string; title: string; description?: string; dueAt?: string; maxScore: number };

export function AssignmentForm() {
  const form = useForm<AssignmentFormValues>({ defaultValues: { maxScore: 100 } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: AssignmentFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await createAssignmentAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ maxScore: 100 });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div><Label>Course ID</Label><Input {...form.register("courseId")} /></div>
      <div><Label>Title</Label><Input {...form.register("title")} /></div>
      <div><Label>Description</Label><Textarea {...form.register("description")} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Due at</Label><Input type="datetime-local" {...form.register("dueAt")} /></div><div><Label>Max score</Label><Input type="number" {...form.register("maxScore", { valueAsNumber: true })} /></div></div>
      <div className="flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating..." : "Create assignment"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
