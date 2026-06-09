"use client";

import { useActionState } from "react";
import { ArrowRightLeft } from "lucide-react";
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

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label>From class</Label>
        <Select name="fromClassroomId" defaultValue="">
          <option value="">Choose current class</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>To class</Label>
        <Select name="toClassroomId" defaultValue="">
          <option value="">Choose next class</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
        </Select>
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
