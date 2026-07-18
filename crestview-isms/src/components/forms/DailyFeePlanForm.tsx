"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { configureDailyFeePlanAction } from "@/features/fees/actions";
import type { SelectOption } from "@/features/admin/queries";

type DailyFeePlanValues = {
  classroomId: string;
  name: string;
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
};

export function DailyFeePlanForm({ classrooms = [] }: { classrooms?: SelectOption[] }) {
  const form = useForm<DailyFeePlanValues>({
    defaultValues: {
      classroomId: classrooms[0]?.id ?? "",
      name: "Daily attendance fee",
      currency: "GHS",
      effectiveFrom: new Date().toISOString().slice(0, 10)
    }
  });
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: DailyFeePlanValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await configureDailyFeePlanAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) {
      form.reset({
        classroomId: values.classroomId,
        name: "Daily attendance fee",
        currency: values.currency || "GHS",
        effectiveFrom: new Date().toISOString().slice(0, 10)
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label>Class or level</Label>
        <Select {...form.register("classroomId")}>
          <option value="">Choose class</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Fee name</Label>
        <Input {...form.register("name")} placeholder="Daily attendance fee" />
      </div>
      <div>
        <Label>Daily amount per student</Label>
        <Input type="number" min="0" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Currency</Label>
        <Input maxLength={3} {...form.register("currency")} />
      </div>
      <div>
        <Label>Effective from</Label>
        <Input type="date" {...form.register("effectiveFrom")} />
      </div>
      <div>
        <Label>Effective to</Label>
        <Input type="date" {...form.register("effectiveTo")} />
      </div>
      <div className="lg:col-span-2">
        <Label>Notes</Label>
        <Textarea placeholder="Optional finance note for this daily fee setup" {...form.register("notes")} />
      </div>
      <div className="flex flex-col items-start gap-3 lg:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting || !classrooms.length}>
          <Save className="size-4" aria-hidden />
          {form.formState.isSubmitting ? "Saving..." : "Save daily fee plan"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
