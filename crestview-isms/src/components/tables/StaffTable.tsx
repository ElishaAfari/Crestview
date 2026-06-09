"use client";

import { useActionState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { deactivateStaffAction } from "@/features/staff/actions";
import { DataTable } from "./DataTable";

export type StaffRow = { id: string; name: string; role: string; phone: string; status?: string };

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

function DeactivateStaffControl({ profileId }: { profileId: string }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => deactivateStaffAction(formData), initialState);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <Button size="sm" variant="secondary" type="submit" disabled={pending}>
        <Archive className="size-4" aria-hidden />Deactivate
      </Button>
      {state.message ? <p className={`max-w-56 text-xs font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

const columns: ColumnDef<StaffRow>[] = [
  { accessorKey: "name", header: "Staff" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status ?? "active"} /> },
  { id: "actions", header: "Controls", cell: ({ row }) => row.original.status === "disabled" ? <span className="text-xs font-black text-[var(--portal-muted)]">Archived</span> : <DeactivateStaffControl profileId={row.original.id} /> }
];

export function StaffTable({ data = [] }: { data?: StaffRow[] }) {
  return <DataTable data={data} columns={columns} />;
}
