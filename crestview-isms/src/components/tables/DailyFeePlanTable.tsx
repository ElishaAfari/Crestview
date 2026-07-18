"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { DailyFeePlanRow } from "@/features/admin/queries";
import { DataTable } from "./DataTable";

export function DailyFeePlanTable({ data = [] }: { data?: DailyFeePlanRow[] }) {
  const columns = useMemo<ColumnDef<DailyFeePlanRow>[]>(() => [
    { accessorKey: "className", header: "Class" },
    { accessorKey: "amount", header: "Daily fee" },
    { accessorKey: "effectiveFrom", header: "From" },
    { accessorKey: "effectiveTo", header: "To" },
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
  ], []);

  return <DataTable data={data} columns={columns} searchPlaceholder="Search fee plans by class, amount, status..." />;
}
