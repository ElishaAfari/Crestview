"use client";

import { useActionState } from "react";
import { ClipboardList, Send } from "lucide-react";
import { createStudent360NoteAction } from "@/features/automation/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState = { ok: false, message: "" };

export function Student360NoteForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(createStudent360NoteAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input id="note-title" name="title" placeholder="Attendance intervention, reading support..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-type">Type</Label>
          <Select id="note-type" name="noteType" defaultValue="academic">
            <option value="academic">Academic</option>
            <option value="attendance">Attendance</option>
            <option value="wellbeing">Wellbeing</option>
            <option value="discipline">Discipline</option>
            <option value="parent_contact">Parent contact</option>
            <option value="finance">Finance</option>
            <option value="general">General</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-body">Details</Label>
        <Textarea id="note-body" name="body" rows={5} placeholder="Record what happened, support agreed, next action, guardian discussion, or learning intervention." required />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select id="visibility" name="visibility" defaultValue="staff">
            <option value="staff">Staff only</option>
            <option value="guardian">Share with guardian</option>
            <option value="restricted">Restricted</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Follow-up priority</Label>
          <Select id="priority" name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueAt">Follow-up due</Label>
          <Input id="dueAt" name="dueAt" type="datetime-local" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-control)] p-3">
        <label className="flex items-center gap-2 text-sm font-black text-[var(--portal-text)]">
          <input className="size-4 accent-blue-700" type="checkbox" name="createTask" /> Create follow-up task
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-[var(--portal-text)]">
          <input className="size-4 accent-emerald-700" type="checkbox" name="notifyGuardians" /> Notify guardians when shared
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          <ClipboardList className="size-4" aria-hidden />Save intervention
        </Button>
        {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
        <span className="ml-auto hidden items-center gap-2 text-xs font-black uppercase text-[var(--portal-muted)] sm:flex">
          <Send className="size-3.5" aria-hidden />Role scoped
        </span>
      </div>
    </form>
  );
}
