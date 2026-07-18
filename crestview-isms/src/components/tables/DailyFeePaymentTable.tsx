"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type DailyFeePaymentTableRow = {
  id: string;
  student: string;
  studentNumber: string;
  classroom: string;
  paymentDate: string;
  amount: string;
  method: string;
  status: string;
  reference: string;
  recordedBy?: string;
  notes: string;
};

export function DailyFeePaymentTable({ data = [] }: { data?: DailyFeePaymentTableRow[] }) {
  const columns = useMemo<ColumnDef<DailyFeePaymentTableRow>[]>(() => {
    const baseColumns: ColumnDef<DailyFeePaymentTableRow>[] = [
    { accessorKey: "paymentDate", header: "Date" },
    { accessorKey: "student", header: "Student" },
    { accessorKey: "studentNumber", header: "Student ID" },
    { accessorKey: "classroom", header: "Class" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "method", header: "Method" },
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    ];
    return data.some((row) => row.recordedBy)
      ? [...baseColumns, { accessorKey: "recordedBy", header: "Recorded by" }]
      : baseColumns;
  }, [data]);

  return <DataTable data={data} columns={columns} searchPlaceholder="Search daily payments by student, ID, class, date, reference..." />;
}
