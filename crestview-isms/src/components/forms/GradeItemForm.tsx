"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createGradeItemAction } from "@/features/grades/actions";
import type { SelectOption } from "@/features/admin/queries";

type GradeItemFormValues = {
  courseId: string;
  title: string;
  category: string;
  maxScore: number;
  weight: number;
  dueDate?: string;
  publishNow: string;
};

export function GradeItemForm({ courses = [] }: { courses?: SelectOption[] }) {
  const form = useForm<GradeItemFormValues>({
    defaultValues: {
      courseId: courses[0]?.id ?? "",
      title: "Class Assessment",
      category: "continuous_assessment",
      maxScore: 50,
      weight: 0.4,
      publishNow: "true"
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: GradeItemFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await createGradeItemAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) {
      form.reset({
        courseId: values.courseId,
        title: "Class Assessment",
        category: "continuous_assessment",
        maxScore: 50,
        weight: 0.4,
        publishNow: "true"
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <Label>Class subject and term</Label>
        <Select {...form.register("courseId")}>
          <option value="">Choose class subject</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Assessment title</Label>
        <Input {...form.register("title")} placeholder="Class Assessment" />
      </div>
      <div>
        <Label>Category</Label>
        <Select {...form.register("category")}>
          <option value="continuous_assessment">Continuous assessment</option>
          <option value="homework">Homework</option>
          <option value="classwork">Classwork</option>
          <option value="project">Project</option>
          <option value="exam">Examination</option>
        </Select>
      </div>
      <div>
        <Label>Max score</Label>
        <Input type="number" step="0.01" min="1" {...form.register("maxScore", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Weight</Label>
        <Input type="number" step="0.01" min="0" max="1" {...form.register("weight", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Due date</Label>
        <Input type="date" {...form.register("dueDate")} />
      </div>
      <div>
        <Label>Status</Label>
        <Select {...form.register("publishNow")}>
          <option value="true">Open for grading</option>
          <option value="false">Save as draft</option>
        </Select>
      </div>
      <div className="lg:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting || !courses.length}>
          <PlusCircle className="size-4" aria-hidden />{form.formState.isSubmitting ? "Creating..." : "Create assessment"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
