"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

type StaffRow = { name: string; role: string; department: string };

const data: StaffRow[] = [
  { name: "Ada Okoro", role: "Teacher", department: "Mathematics" },
  { name: "Marcus Lee", role: "Teacher", department: "Languages" },
  { name: "Sophia Mensah", role: "Teacher", department: "Science" }
];

const columns: ColumnDef<StaffRow>[] = [
  { accessorKey: "name", header: "Staff" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "department", header: "Department" }
];

export function StaffTable() {
  return <DataTable data={data} columns={columns} />;
}
