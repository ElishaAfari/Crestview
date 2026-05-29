"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { admissionSchema } from "@/lib/validations/admission.schema";

type AdmissionFormValues = {
  applicantFirstName: string;
  applicantLastName: string;
  applyingGrade: string;
  guardianEmail: string;
  guardianPhone: string;
  notes?: string;
};

export function AdmissionForm() {
  const form = useForm<AdmissionFormValues>();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: AdmissionFormValues) {
    const result = admissionSchema.safeParse(values);
    setMessage(result.success ? "Application captured for review." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("applicantFirstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("applicantLastName")} /></div>
      <div><Label>Applying grade</Label><Input {...form.register("applyingGrade")} /></div>
      <div><Label>Guardian email</Label><Input type="email" {...form.register("guardianEmail")} /></div>
      <div><Label>Guardian phone</Label><Input {...form.register("guardianPhone")} /></div>
      <div className="sm:col-span-2"><Label>Notes</Label><Textarea {...form.register("notes")} /></div>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">Submit application</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
