"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createStaffAction } from "@/features/staff/actions";

type StaffFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  staffNumber?: string;
  jobTitle?: string;
  employmentType: "full_time" | "part_time" | "contract" | "intern";
  role: "teacher" | "hr_staff" | "finance_officer" | "librarian" | "it_support";
};

export function StaffForm() {
  const form = useForm<StaffFormValues>({ defaultValues: { role: "teacher", employmentType: "full_time" } });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: StaffFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));
    const result = await createStaffAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset({ role: "teacher", employmentType: "full_time" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
      <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
      <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
      <div><Label>Staff number</Label><Input placeholder="Auto-generated if blank" {...form.register("staffNumber")} /></div>
      <div><Label>Job title</Label><Input placeholder="Teacher, HR officer, bursar..." {...form.register("jobTitle")} /></div>
      <div>
        <Label>Role</Label>
        <Select {...form.register("role")}>
          <option value="teacher">Teacher</option>
          <option value="hr_staff">HR staff</option>
          <option value="finance_officer">Finance officer</option>
          <option value="librarian">Librarian</option>
          <option value="it_support">IT support</option>
        </Select>
      </div>
      <div>
        <Label>Employment type</Label>
        <Select {...form.register("employmentType")}>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contract">Contract</option>
          <option value="intern">Intern</option>
        </Select>
      </div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Inviting..." : "Invite staff member"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
