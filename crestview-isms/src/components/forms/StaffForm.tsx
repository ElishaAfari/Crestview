"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staffSchema } from "@/lib/validations/staff.schema";

type StaffFormValues = { firstName: string; lastName: string; email: string; phone?: string; role: "teacher" | "hr_staff" | "finance_officer" | "librarian" | "it_support" };

export function StaffForm() {
  const form = useForm<StaffFormValues>({ defaultValues: { role: "teacher" } });
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: StaffFormValues) {
    const result = staffSchema.safeParse(values);
    setMessage(result.success ? "Staff record is ready to save." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
      <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
      <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
      <div><Label>Role</Label><Input {...form.register("role")} /></div>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">Save staff</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
