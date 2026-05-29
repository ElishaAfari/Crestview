"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

type AttendanceRow = { student: string; date: string; status: string };

const data: AttendanceRow[] = [
  { student: "Amara Cole", date: "2026-05-29", status: "present" },
  { student: "Daniel Mensah", date: "2026-05-29", status: "present" },
  { student: "Lina Hassan", date: "2026-05-29", status: "late" }
];

const columns: ColumnDef<AttendanceRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function AttendanceTable() {
  return <DataTable data={data} columns={columns} />;
}
