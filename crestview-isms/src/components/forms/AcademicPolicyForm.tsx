"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateAcademicPolicyAction } from "@/features/settings/actions";
import type { AcademicPolicySettings } from "@/features/settings/queries";

type AcademicPolicyValues = AcademicPolicySettings;

export function AcademicPolicyForm({ settings }: { settings: AcademicPolicySettings }) {
  const form = useForm<AcademicPolicyValues>({ defaultValues: settings });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: AcademicPolicyValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await updateAcademicPolicyAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label>Terms per academic year</Label>
        <Input type="number" min="1" max="4" {...form.register("termsPerYear", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Grade scale</Label>
        <Select {...form.register("gradeScale")}>
          <option value="A1-F9">A1-F9</option>
          <option value="A-F">A-F</option>
          <option value="Percentage">Percentage only</option>
        </Select>
      </div>
      <div>
        <Label>Class score weight (%)</Label>
        <Input type="number" min="0" max="100" {...form.register("classScoreWeight", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Exam weight (%)</Label>
        <Input type="number" min="0" max="100" {...form.register("examWeight", { valueAsNumber: true })} />
      </div>
      <div className="lg:col-span-2">
        <Label>Attendance control</Label>
        <Select {...form.register("attendanceLocking")}>
          <option value="daily_submitted_register">Daily submitted register</option>
          <option value="admin_reopen_required">Admin reopen required for corrections</option>
          <option value="teacher_same_day_correction">Teacher same-day correction allowed</option>
        </Select>
      </div>
      <div className="lg:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Settings2 className="size-4" aria-hidden />{form.formState.isSubmitting ? "Saving..." : "Save academic policy"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
