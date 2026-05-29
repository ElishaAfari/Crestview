"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feeSchema } from "@/lib/validations/fee.schema";

type FeeFormValues = { studentId: string; amount: number; currency: string; dueDate: string };

export function FeeForm() {
  const form = useForm<FeeFormValues>({ defaultValues: { currency: "USD" } });
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: FeeFormValues) {
    const result = feeSchema.safeParse(values);
    setMessage(result.success ? "Invoice is ready to issue." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>Student ID</Label><Input {...form.register("studentId")} /></div>
      <div><Label>Amount</Label><Input type="number" {...form.register("amount", { valueAsNumber: true })} /></div>
      <div><Label>Currency</Label><Input {...form.register("currency")} /></div>
      <div><Label>Due date</Label><Input type="date" {...form.register("dueDate")} /></div>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">Create invoice</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
