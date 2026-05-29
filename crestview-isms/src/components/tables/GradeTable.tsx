"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

type GradeRow = { student: string; subject: string; score: string; status: string };

const data: GradeRow[] = [
  { student: "Amara Cole", subject: "Mathematics", score: "88%", status: "published" },
  { student: "Daniel Mensah", subject: "English", score: "84%", status: "published" },
  { student: "Lina Hassan", subject: "Biology", score: "91%", status: "draft" }
];

const columns: ColumnDef<GradeRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "score", header: "Score" },
  { accessorKey: "status", header: "Status" }
];

export function GradeTable() {
  return <DataTable data={data} columns={columns} />;
}
