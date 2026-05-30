"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction } from "@/features/staff/actions";

type StaffFormValues = { firstName: string; lastName: string; email: string; phone?: string; role: "teacher" | "hr_staff" | "finance_officer" | "librarian" | "it_support" };

export function StaffForm() {
  const form = useForm<StaffFormValues>({ defaultValues: { role: "teacher" } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: StaffFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));
    const result = await createStaffAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ role: "teacher" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
      <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
      <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
      <div><Label>Role</Label><Input {...form.register("role")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Inviting..." : "Invite staff member"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
