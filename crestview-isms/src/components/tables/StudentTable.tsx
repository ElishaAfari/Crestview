"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type StudentRow = { id: string; name: string; studentNumber: string; classroom: string; status: string };

const columns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "studentNumber", header: "Student number" },
  { accessorKey: "classroom", header: "Class" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function StudentTable({ data = [] }: { data?: StudentRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
