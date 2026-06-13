"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { DataTable } from "./DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

export type ReportRow = { id: string; student: string; academicYear: string; term: string; summary: string; status?: string; downloadUrl?: string; createdAt: string };

const columns: ColumnDef<ReportRow>[] = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "academicYear", header: "Year" },
  { accessorKey: "term", header: "Term" },
  { accessorKey: "summary", header: "Summary" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status ?? "draft"} /> },
  { accessorKey: "createdAt", header: "Created" },
  {
    id: "download",
    header: "PDF",
    cell: ({ row }) => (
      <a className="portal-register-link h-9 px-3 text-xs" href={row.original.downloadUrl ?? `/api/reports/${row.original.id}/pdf`} target="_blank" rel="noreferrer">
        <Download className="size-4" aria-hidden />Download
      </a>
    )
  }
];

export function ReportTable({ data = [] }: { data?: ReportRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
