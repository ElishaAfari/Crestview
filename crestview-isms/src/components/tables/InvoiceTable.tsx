"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type InvoiceRow = { id: string; invoiceNumber: string; title?: string; student: string; amount: string; status: string; dueDate: string };

const columns: ColumnDef<InvoiceRow>[] = [
  { accessorKey: "invoiceNumber", header: "Invoice" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "student", header: "Student" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "dueDate", header: "Due date" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function InvoiceTable({ data = [] }: { data?: InvoiceRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
