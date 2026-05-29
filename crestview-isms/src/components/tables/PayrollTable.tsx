"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

type PayrollRow = { staff: string; gross: string; deductions: string; net: string };

const data: PayrollRow[] = [
  { staff: "Ada Okoro", gross: "$4,200", deductions: "$420", net: "$3,780" },
  { staff: "Marcus Lee", gross: "$4,200", deductions: "$420", net: "$3,780" },
  { staff: "Sophia Mensah", gross: "$4,200", deductions: "$420", net: "$3,780" }
];

const columns: ColumnDef<PayrollRow>[] = [
  { accessorKey: "staff", header: "Staff" },
  { accessorKey: "gross", header: "Gross" },
  { accessorKey: "deductions", header: "Deductions" },
  { accessorKey: "net", header: "Net" }
];

export function PayrollTable() {
  return <DataTable data={data} columns={columns} />;
}
