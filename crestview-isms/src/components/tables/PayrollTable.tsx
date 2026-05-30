"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

type PayrollRow = { id: string; staff: string; gross: string; deductions: string; net: string };

const columns: ColumnDef<PayrollRow>[] = [
  { accessorKey: "staff", header: "Staff" },
  { accessorKey: "gross", header: "Gross" },
  { accessorKey: "deductions", header: "Deductions" },
  { accessorKey: "net", header: "Net" }
];

export function PayrollTable({ data = [] }: { data?: PayrollRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
