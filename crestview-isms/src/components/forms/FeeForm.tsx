"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvoiceAction } from "@/features/fees/actions";

type FeeFormValues = { studentId: string; amount: number; currency: string; dueDate: string };

export function FeeForm() {
  const form = useForm<FeeFormValues>({ defaultValues: { currency: "GHS" } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: FeeFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await createInvoiceAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ currency: "GHS" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>Student ID</Label><Input {...form.register("studentId")} /></div>
      <div><Label>Amount</Label><Input type="number" {...form.register("amount", { valueAsNumber: true })} /></div>
      <div><Label>Currency</Label><Input {...form.register("currency")} /></div>
      <div><Label>Due date</Label><Input type="date" {...form.register("dueDate")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating..." : "Create invoice"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
