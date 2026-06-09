"use client";

import { useActionState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { withdrawStudentAction } from "@/features/students/actions";
import { DataTable } from "./DataTable";

export type StudentRow = { id: string; name: string; studentNumber: string; classroom: string; status: string };

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

function WithdrawStudentControl({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => withdrawStudentAction(formData), initialState);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <Button size="sm" variant="secondary" type="submit" disabled={pending}>
        <Archive className="size-4" aria-hidden />Withdraw
      </Button>
      {state.message ? <p className={`max-w-56 text-xs font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

const baseColumns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "studentNumber", header: "Student number" },
  { accessorKey: "classroom", header: "Class" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function StudentTable({ data = [], showControls = false }: { data?: StudentRow[]; showControls?: boolean }) {
  const columns: ColumnDef<StudentRow>[] = showControls
    ? [
        ...baseColumns,
        { id: "actions", header: "Controls", cell: ({ row }) => row.original.status === "active" ? <WithdrawStudentControl studentId={row.original.id} /> : <span className="text-xs font-black text-[var(--portal-muted)]">Archived</span> }
      ]
    : baseColumns;
  return <DataTable data={data} columns={columns} />;
}
