"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitAdmissionAction } from "@/features/admissions/actions";

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
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: AdmissionFormValues) {
    setMessage(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));
    const result = await submitAdmissionAction(formData);
    setMessage(result.message);
    setSubmitted(result.ok);
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label className="text-slate-700">First name</Label><Input required className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("applicantFirstName")} /></div>
      <div><Label className="text-slate-700">Last name</Label><Input required className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("applicantLastName")} /></div>
      <div><Label className="text-slate-700">Applying grade</Label><Input required placeholder="e.g. Primary 3" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("applyingGrade")} /></div>
      <div><Label className="text-slate-700">Guardian email</Label><Input required type="email" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("guardianEmail")} /></div>
      <div><Label className="text-slate-700">Guardian phone</Label><Input required type="tel" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("guardianPhone")} /></div>
      <div className="sm:col-span-2"><Label className="text-slate-700">Notes</Label><Textarea placeholder="Tell us anything that will help us support your child." className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" {...form.register("notes")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#cf1017] text-white hover:bg-[#ad0d13]">
          {form.formState.isSubmitting ? "Submitting..." : "Submit application"}
        </Button>
        {message ? <p className={`text-sm font-medium ${submitted ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
