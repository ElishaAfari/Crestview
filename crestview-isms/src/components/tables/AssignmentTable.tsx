"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

export type AssignmentRow = { id: string; title: string; course: string; dueAt: string; maxScore: string };

const columns: ColumnDef<AssignmentRow>[] = [
  { accessorKey: "title", header: "Assignment" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "dueAt", header: "Due" },
  { accessorKey: "maxScore", header: "Max score" }
];

export function AssignmentTable({ data = [] }: { data?: AssignmentRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
