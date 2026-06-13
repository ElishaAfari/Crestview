"use client";

import { useActionState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Save } from "lucide-react";
import { updateWorkflowTaskStatusAction } from "@/features/automation/actions";
import type { WorkflowTaskRow } from "@/features/automation/queries";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";

const initialState = { ok: false, message: "" };

function TaskStatusControl({ task }: { task: WorkflowTaskRow }) {
  const [state, action, pending] = useActionState(updateWorkflowTaskStatusAction, initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="taskId" value={task.id} />
      <div className="flex flex-wrap items-center gap-2">
        <Select name="status" defaultValue={task.status} className="h-9 w-36">
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          <Save className="size-3.5" aria-hidden />Save
        </Button>
      </div>
      {state.message ? <p className={`max-w-56 text-xs font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

const columns: ColumnDef<WorkflowTaskRow>[] = [
  { accessorKey: "taskNumber", header: "Task" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "workflowKey", header: "Workflow" },
  { accessorKey: "priority", header: "Priority", cell: ({ row }) => <StatusBadge status={row.original.priority} /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "assignee", header: "Assignee" },
  { accessorKey: "student", header: "Student" },
  { accessorKey: "classroom", header: "Class" },
  { accessorKey: "dueAt", header: "Due" },
  { id: "controls", header: "Controls", cell: ({ row }) => <TaskStatusControl task={row.original} /> }
];

export function WorkflowTaskTable({ data }: { data: WorkflowTaskRow[] }) {
  return <DataTable data={data} columns={columns} searchPlaceholder="Search task, workflow, assignee, student..." />;
}
