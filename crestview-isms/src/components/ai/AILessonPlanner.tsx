"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { generateLessonPlanAction } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type State = { ok: boolean; message: string; plan: string };
const initialState: State = { ok: false, message: "", plan: "Lesson structure will appear here." };

export function AILessonPlanner() {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => generateLessonPlanAction(formData), initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Topic</Label><Input required name="topic" placeholder="Fractions with real-life examples" /></div>
        <div><Label>Duration</Label><Input required name="duration" defaultValue="45 minutes" /></div>
        <div><Label>Class level</Label><Input name="classLevel" placeholder="Primary 4" /></div>
        <div><Label>Subject</Label><Input name="subject" placeholder="Mathematics" /></div>
      </div>
      <div><Label>Learning objectives</Label><Textarea required name="objectives" placeholder="Learners should be able to compare fractions, explain numerator and denominator, and solve two practice questions." /></div>
      <Button type="submit" className="w-fit" disabled={pending}>
        <Sparkles className="size-4" aria-hidden />
        {pending ? "Generating..." : "Generate plan"}
      </Button>
      {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      <pre className="portal-subtle-card max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg p-4 text-sm font-semibold leading-6 text-[var(--portal-text)]">{state.plan}</pre>
    </form>
  );
}
