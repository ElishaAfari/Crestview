"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordAttendanceAction } from "@/features/attendance/actions";
import type { SelectOption } from "@/features/admin/queries";

type AttendanceFormValues = {
  studentId: string;
  classroomId?: string;
  courseId?: string;
  attendanceDate: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
};

export function AttendanceForm({ classrooms = [], courses = [], students = [] }: { classrooms?: SelectOption[]; courses?: SelectOption[]; students?: SelectOption[] }) {
  const form = useForm<AttendanceFormValues>({
    defaultValues: {
      studentId: students[0]?.id ?? "",
      classroomId: classrooms[0]?.id ?? "",
      courseId: "",
      attendanceDate: new Date().toISOString().slice(0, 10),
      status: "present"
    }
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: AttendanceFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await recordAttendanceAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Student</Label>
        <Select {...form.register("studentId")}>
          <option value="">Choose student</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Classroom</Label>
        <Select {...form.register("classroomId")}>
          <option value="">Use student classroom</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Course</Label>
        <Select {...form.register("courseId")}>
          <option value="">Daily attendance</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}
        </Select>
      </div>
      <div><Label>Date</Label><Input type="date" {...form.register("attendanceDate")} /></div>
      <div>
        <Label>Status</Label>
        <Select {...form.register("status")}>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="excused">Excused</option>
        </Select>
      </div>
      <div className="sm:col-span-2"><Label>Notes</Label><Textarea {...form.register("notes")} placeholder="Optional attendance note." /></div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <ClipboardCheck className="size-4" aria-hidden />{form.formState.isSubmitting ? "Recording..." : "Record attendance"}
        </Button>
        {message ? <p className={`text-sm ${submitted ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
