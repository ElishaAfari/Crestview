"use client";

import { useActionState, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { bulkRecordAttendanceAction } from "@/features/attendance/actions";
import type { TeacherAttendanceCourse } from "@/features/dashboard/queries";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };
const statuses = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" }
];

export function BulkAttendanceForm({ courses = [] }: { courses?: TeacherAttendanceCourse[] }) {
  const [selectedClassId, setSelectedClassId] = useState(courses[0]?.classroomId ?? "");
  const selectedClass = useMemo(() => courses.find((course) => course.classroomId === selectedClassId) ?? courses[0], [courses, selectedClassId]);
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => bulkRecordAttendanceAction(formData), initialState);

  if (!courses.length) {
    return <p className="text-sm text-[var(--portal-muted)]">No assigned classes are available for attendance yet.</p>;
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Assigned class</Label>
          <Select value={selectedClass?.classroomId ?? ""} onChange={(event) => setSelectedClassId(event.target.value)}>
            {courses.map((course) => <option key={course.classroomId} value={course.classroomId}>{course.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input name="attendanceDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>
      <input type="hidden" name="classroomId" value={selectedClass?.classroomId ?? ""} />
      {selectedClass ? (
        <div>
          <p className="text-sm font-semibold text-[var(--portal-text)]">{selectedClass.classroomLabel}</p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--portal-border)]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--portal-surface-strong)] text-xs uppercase text-[var(--portal-muted)]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student number</th>
                  {statuses.map((status) => <th key={status.value} className="px-4 py-3 text-center">{status.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {selectedClass.students.length ? selectedClass.students.map((student) => (
                  <tr key={student.id} className="border-t border-[var(--portal-border)]">
                    <td className="px-4 py-3 font-medium text-[var(--portal-text)]">{student.name}</td>
                    <td className="px-4 py-3 text-[var(--portal-muted)]">{student.studentNumber}</td>
                    {statuses.map((status) => (
                      <td key={status.value} className="px-4 py-3 text-center">
                        <input
                          aria-label={`${student.name} ${status.label}`}
                          className="size-4 accent-primary"
                          type="radio"
                          name={`status:${student.id}`}
                          value={status.value}
                          defaultChecked={status.value === "present"}
                        />
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--portal-muted)]">No active students are assigned to this classroom.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending || !selectedClass?.students.length}>
          <ClipboardCheck className="size-4" aria-hidden />
          {pending ? "Saving register..." : "Save attendance register"}
        </Button>
        {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
