"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, GraduationCap } from "lucide-react";
import type { Student360Row } from "@/features/automation/queries";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

function Percent({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-emerald-600" : value >= 60 ? "bg-amber-500" : "bg-red-600";
  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between gap-3">
        <span className="font-black text-[var(--portal-text)]">{Math.round(value)}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-[#d7e8ff] dark:bg-white/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function getColumns(profileBasePath: string): ColumnDef<Student360Row>[] {
  return [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="portal-icon-tile portal-tone-blue size-9 rounded-lg">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-black text-[var(--portal-text)]">{row.original.student}</p>
            <p className="text-xs font-bold text-[var(--portal-muted)]">{row.original.studentNumber}</p>
          </div>
        </div>
      )
    },
    { accessorKey: "classroom", header: "Class" },
    { accessorKey: "riskLabel", header: "Risk", cell: ({ row }) => <StatusBadge status={row.original.riskLabel} /> },
    { accessorKey: "attendanceRate", header: "Attendance", cell: ({ row }) => <Percent value={row.original.attendanceRate} /> },
    { accessorKey: "attendance30", header: "30 days", cell: ({ row }) => <Percent value={row.original.attendance30} /> },
    { accessorKey: "gradeAverage", header: "Average", cell: ({ row }) => <Percent value={row.original.gradeAverage} /> },
    { accessorKey: "lowGrades", header: "Low grades" },
    { accessorKey: "openInvoices", header: "Invoices" },
    { accessorKey: "openAmount", header: "Open amount" },
    { accessorKey: "reports", header: "Reports" },
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "profile",
      header: "Profile",
      cell: ({ row }) => (
        <Link className="portal-register-link h-9 px-3 text-xs" href={`${profileBasePath}/${row.original.id}`}>
          Open <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      )
    }
  ];
}

export function Student360Table({ data, profileBasePath = "/admin/student-360" }: { data: Student360Row[]; profileBasePath?: string }) {
  return <DataTable data={data} columns={getColumns(profileBasePath)} searchPlaceholder="Search student, class, risk, invoice, report..." />;
}
