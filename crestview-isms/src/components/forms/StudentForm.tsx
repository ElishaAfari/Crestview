"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentSchema } from "@/lib/validations/student.schema";

type StudentFormValues = { firstName: string; lastName: string; email: string; studentNumber: string; classroomId: string; enrollmentDate: string };

export function StudentForm() {
  const form = useForm<StudentFormValues>();
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(values: StudentFormValues) {
    const result = studentSchema.safeParse(values);
    setMessage(result.success ? "Student record is ready to save." : result.error.issues[0]?.message ?? "Check the form.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input {...form.register("firstName")} /></div>
      <div><Label>Last name</Label><Input {...form.register("lastName")} /></div>
      <div><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
      <div><Label>Student number</Label><Input {...form.register("studentNumber")} /></div>
      <div><Label>Classroom ID</Label><Input {...form.register("classroomId")} /></div>
      <div><Label>Enrollment date</Label><Input type="date" {...form.register("enrollmentDate")} /></div>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">Save student</Button>{message ? <p className="text-sm text-slate-400">{message}</p> : null}</div>
    </form>
  );
}
