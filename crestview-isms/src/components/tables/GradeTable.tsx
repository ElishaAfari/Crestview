"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

export type GradeRow = {
  id: string;
  student: string;
  assessment: string;
  score: string;
  percentage?: string;
  gradeCode?: string;
  remark?: string;
  comments: string;
};

const columns: ColumnDef<GradeRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "assessment", header: "Assessment" },
  { accessorKey: "score", header: "Score" },
  { accessorKey: "percentage", header: "Percent" },
  { accessorKey: "gradeCode", header: "Grade" },
  { accessorKey: "remark", header: "Remark" },
  { accessorKey: "comments", header: "Comments" }
];

export function GradeTable({ data = [] }: { data?: GradeRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
