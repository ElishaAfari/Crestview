"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { saveClassRosterAction } from "@/features/rosters/actions";
import type { TeacherClassRoster } from "@/features/dashboard/queries";

type DraftStudent = { studentNumber: string; firstName: string; lastName: string };

function blankRow(): DraftStudent {
  return { studentNumber: "", firstName: "", lastName: "" };
}

function rowsFromRoster(roster: TeacherClassRoster | undefined): DraftStudent[] {
  if (!roster?.students.length) return [blankRow()];
  return roster.students.map((student) => ({
    studentNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName
  }));
}

export function ClassRosterManager({ rosters = [] }: { rosters?: TeacherClassRoster[] }) {
  const [classroomId, setClassroomId] = useState(rosters[0]?.classroomId ?? "");
  const [classSearch, setClassSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const selectedRoster = useMemo(() => rosters.find((roster) => roster.classroomId === classroomId) ?? rosters[0], [classroomId, rosters]);
  const [rows, setRows] = useState<DraftStudent[]>(() => rowsFromRoster(selectedRoster));
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });

  useEffect(() => {
    setRows(rowsFromRoster(selectedRoster));
    setState({ ok: false, message: "" });
  }, [selectedRoster]);

  function updateRow(index: number, field: keyof DraftStudent, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  }

  function removeRow(index: number) {
    setRows((current) => current.length === 1 ? [blankRow()] : current.filter((_, rowIndex) => rowIndex !== index));
  }
  const filteredRosters = useMemo(() => {
    const needle = classSearch.trim().toLowerCase();
    if (!needle) return rosters;
    return rosters.filter((roster) => `${roster.gradeLevel} ${roster.classroomName} ${roster.academicYear}`.toLowerCase().includes(needle));
  }, [classSearch, rosters]);
  const visibleRosters = useMemo(() => {
    if (!selectedRoster || filteredRosters.some((roster) => roster.classroomId === selectedRoster.classroomId)) return filteredRosters;
    return [selectedRoster, ...filteredRosters];
  }, [filteredRosters, selectedRoster]);
  const visibleRows = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !needle || `${row.studentNumber} ${row.firstName} ${row.lastName}`.toLowerCase().includes(needle));
  }, [rows, studentSearch]);

  async function saveRoster() {
    if (!selectedRoster) return;
    setPending(true);
    const validRows = rows
      .map((row) => ({
        studentNumber: row.studentNumber.trim(),
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim()
      }))
      .filter((row) => row.studentNumber || row.firstName || row.lastName);
    const formData = new FormData();
    formData.set("classroomId", selectedRoster.classroomId);
    formData.set("rosterJson", JSON.stringify(validRows));
    const result = await saveClassRosterAction(formData);
    setState(result);
    setPending(false);
  }

  if (!rosters.length) {
    return <p className="text-sm text-[var(--portal-muted)]">No assigned class rosters are available yet.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <Label>Assigned class</Label>
          <label className="portal-field mt-1 flex items-center gap-2 rounded-lg px-3 py-2">
            <Search className="size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
            <input
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              placeholder="Search assigned class..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--portal-text)] outline-none"
              type="search"
            />
          </label>
          <Select value={selectedRoster?.classroomId ?? ""} onChange={(event) => setClassroomId(event.target.value)}>
            {visibleRosters.map((roster) => (
              <option key={roster.classroomId} value={roster.classroomId}>
                {roster.gradeLevel} - {roster.classroomName} ({roster.academicYear})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Subjects</Label>
          <div className="portal-subtle-card mt-1 flex min-h-10 flex-wrap gap-2 rounded-lg px-3 py-2">
            {selectedRoster?.subjects.length ? selectedRoster.subjects.map((subject) => <Badge key={subject} tone="blue">{subject}</Badge>) : <span className="text-sm text-[var(--portal-muted)]">No subjects configured</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-lg">
        <Label>Find student row</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-700 dark:text-blue-200" aria-hidden />
          <Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search name or student ID..." className="pl-9" type="search" />
        </div>
      </div>

      <div className="portal-table-wrap max-h-[34rem]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="portal-table-head text-xs uppercase">
            <tr>
              <th className="w-44 px-4 py-3">Student ID</th>
              <th className="px-4 py-3">First name</th>
              <th className="px-4 py-3">Last name</th>
              <th className="w-20 px-4 py-3">Remove</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? visibleRows.map(({ row, index }) => (
              <tr key={index} className="portal-table-row">
                <td className="px-4 py-3"><Input value={row.studentNumber} onChange={(event) => updateRow(index, "studentNumber", event.target.value)} placeholder="26000001 or blank" inputMode="numeric" /></td>
                <td className="px-4 py-3"><Input value={row.firstName} onChange={(event) => updateRow(index, "firstName", event.target.value)} /></td>
                <td className="px-4 py-3"><Input value={row.lastName} onChange={(event) => updateRow(index, "lastName", event.target.value)} /></td>
                <td className="px-4 py-3">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} aria-label="Remove student row">
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-bold text-[var(--portal-muted)]">No student rows match that search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={() => setRows((current) => [...current, blankRow()])}>
          <Plus className="size-4" aria-hidden />Add student row
        </Button>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Button type="button" onClick={saveRoster} disabled={pending}>
            <Save className="size-4" aria-hidden />{pending ? "Saving roster..." : "Save class roster"}
          </Button>
          {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
        </div>
      </div>
    </div>
  );
}
