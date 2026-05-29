"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

type StudentRow = { name: string; grade: string; attendance: string; status: string };

const data: StudentRow[] = [
  { name: "Amara Cole", grade: "Grade 7A", attendance: "97%", status: "active" },
  { name: "Daniel Mensah", grade: "Grade 7A", attendance: "94%", status: "active" },
  { name: "Lina Hassan", grade: "Grade 7A", attendance: "91%", status: "active" }
];

const columns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "grade", header: "Class" },
  { accessorKey: "attendance", header: "Attendance" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function StudentTable() {
  return <DataTable data={data} columns={columns} />;
}
