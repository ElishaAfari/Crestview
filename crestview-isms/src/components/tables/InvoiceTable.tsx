"use client";

import { useActionState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import { updateInvoiceLifecycleAction } from "@/features/fees/actions";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "./DataTable";

export type InvoiceRow = { id: string; invoiceNumber: string; title?: string; student: string; amount: string; status: string; dueDate: string };

const initialState = { ok: false, message: "" };

function InvoiceControls({ invoice }: { invoice: InvoiceRow }) {
  const [state, action, pending] = useActionState(updateInvoiceLifecycleAction, initialState);
  const isPaid = invoice.status === "paid";
  const isVoid = invoice.status === "void";
  const blocked = pending || isVoid;

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="invoiceId" value={invoice.id} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="mark_paid" size="sm" variant="secondary" disabled={blocked || isPaid}>
          <CheckCircle2 className="size-3.5" aria-hidden />Paid
        </Button>
        <Button type="submit" name="intent" value="mark_overdue" size="sm" variant="secondary" disabled={blocked || isPaid || invoice.status === "overdue"}>
          <AlertTriangle className="size-3.5" aria-hidden />Overdue
        </Button>
        <Button type="submit" name="intent" value="void" size="sm" variant="secondary" disabled={blocked || isPaid}>
          <Ban className="size-3.5" aria-hidden />Void
        </Button>
      </div>
      {state.message ? <p className={`max-w-72 text-xs font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

export function InvoiceTable({ data = [], showControls = false }: { data?: InvoiceRow[]; showControls?: boolean }) {
  const columns = useMemo<ColumnDef<InvoiceRow>[]>(() => {
    const baseColumns: ColumnDef<InvoiceRow>[] = [
      { accessorKey: "invoiceNumber", header: "Invoice" },
      { accessorKey: "title", header: "Title" },
      { accessorKey: "student", header: "Student" },
      { accessorKey: "amount", header: "Amount" },
      { accessorKey: "dueDate", header: "Due date" },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> }
    ];
    return showControls
      ? [...baseColumns, { id: "controls", header: "Controls", cell: ({ row }) => <InvoiceControls invoice={row.original} /> }]
      : baseColumns;
  }, [showControls]);

  return <DataTable data={data} columns={columns} />;
}
