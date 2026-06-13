"use client";

import { useActionState } from "react";
import { ClipboardPlus } from "lucide-react";
import { createManualWorkflowTaskAction } from "@/features/automation/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; label: string };

const initialState = { ok: false, message: "" };

export function WorkflowTaskForm({
  assignees,
  students,
  classrooms
}: {
  assignees: Option[];
  students: Option[];
  classrooms: Option[];
}) {
  const [state, action, pending] = useActionState(createManualWorkflowTaskAction, initialState);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label>Task title</Label>
        <Input name="title" placeholder="Follow up parent payment confirmation" required />
      </div>
      <div>
        <Label>Workflow</Label>
        <Select name="workflowKey" defaultValue="general">
          <option value="general">General operations</option>
          <option value="admissions_onboarding">Admissions onboarding</option>
          <option value="finance_collection">Finance collection</option>
          <option value="academic_follow_up">Academic follow-up</option>
          <option value="attendance_follow_up">Attendance follow-up</option>
          <option value="it_support">IT support</option>
          <option value="hr_follow_up">HR follow-up</option>
        </Select>
      </div>
      <div>
        <Label>Priority</Label>
        <Select name="priority" defaultValue="normal">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </div>
      <div>
        <Label>Assign to</Label>
        <Select name="assignedTo" defaultValue="">
          <option value="">Unassigned</option>
          {assignees.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Due date</Label>
        <Input name="dueAt" type="datetime-local" />
      </div>
      <div>
        <Label>Student link</Label>
        <Select name="studentId" defaultValue="">
          <option value="">No student link</option>
          {students.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Class link</Label>
        <Select name="classroomId" defaultValue="">
          <option value="">No class link</option>
          {classrooms.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label>Details</Label>
        <Textarea name="description" placeholder="What needs to happen, who is affected, and what should count as done?" />
      </div>
      <div className="flex flex-col items-start gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>
          <ClipboardPlus className="size-4" aria-hidden />{pending ? "Creating..." : "Create workflow task"}
        </Button>
        {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
