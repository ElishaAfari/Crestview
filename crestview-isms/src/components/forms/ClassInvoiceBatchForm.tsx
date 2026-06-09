"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClassInvoiceBatchAction } from "@/features/fees/actions";
import type { SelectOption } from "@/features/admin/queries";

type ClassInvoiceFormValues = {
  classroomId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate: string;
};

export function ClassInvoiceBatchForm({ classrooms = [] }: { classrooms?: SelectOption[] }) {
  const form = useForm<ClassInvoiceFormValues>({
    defaultValues: {
      classroomId: classrooms[0]?.id ?? "",
      title: "Term fees",
      currency: "GHS"
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: ClassInvoiceFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await createClassInvoiceBatchAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ classroomId: classrooms[0]?.id ?? "", title: "Term fees", currency: "GHS" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-2">
      <div>
        <Label>Class or level</Label>
        <Select {...form.register("classroomId")}>
          <option value="">Choose class</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Invoice title</Label>
        <Input placeholder="Primary 1 Term 1 fees" {...form.register("title")} />
      </div>
      <div>
        <Label>Amount per student</Label>
        <Input type="number" min="0" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Currency</Label>
        <Input maxLength={3} {...form.register("currency")} />
      </div>
      <div>
        <Label>Due date</Label>
        <Input type="date" {...form.register("dueDate")} />
      </div>
      <div className="xl:row-span-2">
        <Label>Description</Label>
        <Textarea placeholder="Optional billing note for parents" {...form.register("description")} />
      </div>
      <div className="flex flex-col items-start gap-3 xl:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Send className="size-4" aria-hidden />{form.formState.isSubmitting ? "Issuing class invoices..." : "Issue class invoice batch"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
