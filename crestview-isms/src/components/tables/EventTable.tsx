"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type EventRow = { id: string; title: string; location: string; startsAt: string; status: string };

const columns: ColumnDef<EventRow>[] = [
  { accessorKey: "title", header: "Event" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "startsAt", header: "Starts" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
];

export function EventTable({ data = [] }: { data?: EventRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
