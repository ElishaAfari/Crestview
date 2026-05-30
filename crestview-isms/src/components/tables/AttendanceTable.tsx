"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type AttendanceRow = { id: string; student: string; date: string; status: string };

const columns: ColumnDef<AttendanceRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function AttendanceTable({ data = [] }: { data?: AttendanceRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
