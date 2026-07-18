"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardCheck } from "lucide-react";
import { StudentQrCapture } from "@/components/forms/StudentQrCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordScannedAttendanceAction } from "@/features/attendance/actions";
import type { SelectOption } from "@/features/admin/queries";
import type { TeacherAttendanceCourse } from "@/features/dashboard/queries";

type QrAttendanceValues = {
  studentLookup: string;
  classroomId: string;
  attendanceDate: string;
  status: "present" | "late" | "absent" | "excused";
  notes?: string;
};

function classOptionsFromRoster(roster: TeacherAttendanceCourse[]): SelectOption[] {
  return roster.map((course) => ({ id: course.classroomId, label: course.label }));
}

export function AttendanceQrScanForm({
  classrooms = [],
  roster = []
}: {
  classrooms?: SelectOption[];
  roster?: TeacherAttendanceCourse[];
}) {
  const options = classrooms.length ? classrooms : classOptionsFromRoster(roster);
  const form = useForm<QrAttendanceValues>({
    defaultValues: {
      studentLookup: "",
      classroomId: options[0]?.id ?? "",
      attendanceDate: new Date().toISOString().slice(0, 10),
      status: "present"
    }
  });
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const studentLookup = form.watch("studentLookup");

  async function onSubmit(values: QrAttendanceValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
    const result = await recordScannedAttendanceAction(formData);
    setSubmitted(result.ok);
    setMessage(result.message);
    if (result.ok) {
      form.reset({
        studentLookup: "",
        classroomId: values.classroomId,
        attendanceDate: values.attendanceDate,
        status: "present"
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Label>Class</Label>
          <Select {...form.register("classroomId")}>
            <option value="">Choose class</option>
            {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" {...form.register("attendanceDate")} />
        </div>
      </div>
      <StudentQrCapture
        value={studentLookup}
        onValue={(value) => form.setValue("studentLookup", value, { shouldDirty: true, shouldValidate: true })}
        label="Student ID card QR"
        placeholder="Scan or type the student number"
      />
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div>
          <Label>Status</Label>
          <Select {...form.register("status")}>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </Select>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea placeholder="Optional attendance note" {...form.register("notes")} />
        </div>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting || !options.length}>
          <ClipboardCheck className="size-4" aria-hidden />
          {form.formState.isSubmitting ? "Saving scan..." : "Record scanned attendance"}
        </Button>
        {message ? <p className={`text-sm font-black ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{message}</p> : null}
      </div>
    </form>
  );
}
