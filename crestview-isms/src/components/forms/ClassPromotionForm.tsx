"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { promoteClassAction } from "@/features/students/actions";
import type { SelectOption } from "@/features/admin/queries";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function ClassPromotionForm({ classrooms = [] }: { classrooms?: SelectOption[] }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => promoteClassAction(formData), initialState);
  const [fromClassroomId, setFromClassroomId] = useState("");
  const [toClassroomId, setToClassroomId] = useState("");
  const [query, setQuery] = useState("");
  const filteredClassrooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return classrooms;
    return classrooms.filter((classroom) => classroom.label.toLowerCase().includes(needle));
  }, [classrooms, query]);
  const suggestedNextClass = useMemo(() => {
    if (!fromClassroomId) return null;
    const index = classrooms.findIndex((classroom) => classroom.id === fromClassroomId);
    return index >= 0 ? classrooms[index + 1] ?? null : null;
  }, [classrooms, fromClassroomId]);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <Label>Find class</Label>
        <label className="portal-field mt-2 flex max-w-2xl items-center gap-2 rounded-lg px-3 py-2">
          <Search className="size-4 shrink-0 text-blue-700 dark:text-blue-200" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search current or destination class..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--portal-text)] outline-none"
            type="search"
          />
        </label>
      </div>
      <div>
        <Label>From class</Label>
        <Select name="fromClassroomId" value={fromClassroomId} onChange={(event) => setFromClassroomId(event.target.value)}>
          <option value="">Choose current class</option>
          {filteredClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>To class</Label>
        <Select name="toClassroomId" value={toClassroomId} onChange={(event) => setToClassroomId(event.target.value)}>
          <option value="">Choose next class</option>
          {filteredClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
        {suggestedNextClass ? (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setToClassroomId(suggestedNextClass.id)}>
            Use suggested next: {suggestedNextClass.label}
          </Button>
        ) : null}
      </div>
      <div className="lg:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" placeholder="Optional promotion notes for the academic record" />
      </div>
      <div className="flex flex-col items-start gap-3 lg:col-span-2">
        <Button type="submit" disabled={pending}>
          <ArrowRightLeft className="size-4" aria-hidden />{pending ? "Promoting class..." : "Promote active students"}
        </Button>
        {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
