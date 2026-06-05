"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

export type ReportRow = { id: string; student: string; academicYear: string; term: string; summary: string; createdAt: string };

const columns: ColumnDef<ReportRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "academicYear", header: "Year" },
  { accessorKey: "term", header: "Term" },
  { accessorKey: "summary", header: "Summary" },
  { accessorKey: "createdAt", header: "Created" }
];

export function ReportTable({ data = [] }: { data?: ReportRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
