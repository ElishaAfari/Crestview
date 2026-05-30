"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStudentAction } from "@/features/students/actions";

type StudentFormValues = { firstName: string; lastName: string; email: string; studentNumber: string; classroomId: string; enrollmentDate: string };

export function StudentForm() {
  const form = useForm<StudentFormValues>();
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: StudentFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    const result = await createStudentAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
      <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
      <div><Label>Student number</Label><Input {...form.register("studentNumber")} /></div>
      <div><Label>Classroom ID</Label><Input {...form.register("classroomId")} /></div>
      <div><Label>Enrollment date</Label><Input type="date" {...form.register("enrollmentDate")} /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Inviting..." : "Invite and enroll student"}</Button>{message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}</div>
    </form>
  );
}
