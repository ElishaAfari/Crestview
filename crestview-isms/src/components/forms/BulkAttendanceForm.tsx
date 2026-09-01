"use client";

import { useActionState, useMemo, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
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
  const [classSearch, setClassSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const selectedClass = useMemo(() => courses.find((course) => course.classroomId === selectedClassId) ?? courses[0], [courses, selectedClassId]);
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => bulkRecordAttendanceAction(formData), initialState);
  const filteredClasses = useMemo(() => {
    const needle = classSearch.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) => `${course.label} ${course.classroomLabel}`.toLowerCase().includes(needle));
  }, [classSearch, courses]);
  const visibleClasses = useMemo(() => {
    if (!selectedClass || filteredClasses.some((course) => course.classroomId === selectedClass.classroomId)) return filteredClasses;
    return [selectedClass, ...filteredClasses];
  }, [filteredClasses, selectedClass]);
  const visibleStudents = useMemo(() => {
    const students = selectedClass?.students ?? [];
    const needle = studentSearch.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) => `${student.name} ${student.studentNumber}`.toLowerCase().includes(needle));
  }, [selectedClass?.students, studentSearch]);

  function currentStatus(studentId: string) {
    return overrides[studentId] ?? "present";
  }

  function markStudent(studentId: string, status: string) {
    setOverrides((current) => ({ ...current, [studentId]: status }));
  }

  function markVisible(status: string) {
    setOverrides((current) => ({
      ...current,
      ...Object.fromEntries(visibleStudents.map((student) => [student.id, status]))
    }));
  }

  if (!courses.length) {
    return <p className="text-sm text-[var(--portal-muted)]">No assigned classes are available for attendance yet.</p>;
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Assigned class</Label>
          <label className="portal-field mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
            <Search className="size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
            <input
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              placeholder="Search assigned class..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--portal-text)] outline-none"
              type="search"
            />
          </label>
          <Select value={selectedClass?.classroomId ?? ""} onChange={(event) => setSelectedClassId(event.target.value)}>
            {visibleClasses.map((course) => <option key={course.classroomId} value={course.classroomId}>{course.label}</option>)}
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--portal-text)]">{selectedClass.classroomLabel}</p>
              <p className="text-xs font-extrabold text-[var(--portal-muted)]">{visibleStudents.length} of {selectedClass.students.length} students visible</p>
            </div>
            <div className="flex flex-1 flex-col gap-2 lg:max-w-xl">
              <Label>Find student in register</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-700 dark:text-blue-200" aria-hidden />
                <Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search name or student ID..." className="pl-9" type="search" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Button key={status.value} type="button" variant="secondary" size="sm" onClick={() => markVisible(status.value)}>
                Mark visible {status.label.toLowerCase()}
              </Button>
            ))}
          </div>
          {selectedClass.students
            .filter((student) => !visibleStudents.some((visibleStudent) => visibleStudent.id === student.id))
            .map((student) => <input key={student.id} type="hidden" name={`status:${student.id}`} value={currentStatus(student.id)} />)}
          {studentSearch ? <p className="mt-2 text-xs font-extrabold text-[var(--portal-muted)]">Filtered-out students are still included in the submission as present unless you clear the search and change them.</p> : null}
          <div className="portal-table-wrap mt-3 max-h-[34rem]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="portal-table-head text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student number</th>
                  {statuses.map((status) => <th key={status.value} className="px-4 py-3 text-center">{status.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleStudents.length ? visibleStudents.map((student) => (
                  <tr key={student.id} className="portal-table-row">
                    <td className="px-4 py-3 font-black text-[var(--portal-text)]">{student.name}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--portal-muted)]">{student.studentNumber}</td>
                    {statuses.map((status) => (
                      <td key={status.value} className="px-4 py-3 text-center">
                        <input
                          aria-label={`${student.name} ${status.label}`}
                          className="size-4 accent-primary"
                          type="radio"
                          name={`status:${student.id}`}
                          value={status.value}
                          checked={currentStatus(student.id) === status.value}
                          onChange={() => markStudent(student.id, status.value)}
                        />
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--portal-muted)]">{selectedClass.students.length ? "No students match that search." : "No active students are assigned to this classroom."}</td>
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
        {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
