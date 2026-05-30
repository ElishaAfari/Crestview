"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

export type StaffRow = { id: string; name: string; role: string; phone: string };

const columns: ColumnDef<StaffRow>[] = [
  { accessorKey: "name", header: "Staff" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "phone", header: "Phone" }
];

export function StaffTable({ data = [] }: { data?: StaffRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
