"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignmentSchema } from "@/lib/validations/assignment.schema";

type AssignmentFormValues = { courseId: string; title: string; description?: string; dueAt?: string; maxScore: number };

export function AssignmentForm() {
  const form = useForm<AssignmentFormValues>({ defaultValues: { maxScore: 100 } });
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: AssignmentFormValues) {
    const result = assignmentSchema.safeParse(values);
    setMessage(result.success ? "Assignment is ready to publish." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div><Label>Course ID</Label><Input {...form.register("courseId")} /></div>
      <div><Label>Title</Label><Input {...form.register("title")} /></div>
      <div><Label>Description</Label><Textarea {...form.register("description")} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Due at</Label><Input type="datetime-local" {...form.register("dueAt")} /></div><div><Label>Max score</Label><Input type="number" {...form.register("maxScore", { valueAsNumber: true })} /></div></div>
      <div className="flex items-center gap-3"><Button type="submit">Create assignment</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
