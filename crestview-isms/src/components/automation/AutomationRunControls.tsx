"use client";

import { useActionState } from "react";
import { BrainCircuit, CalendarClock } from "lucide-react";
import { refreshAnalyticsAction } from "@/features/analytics/actions";
import { optimizeTimetableAction } from "@/features/timetables/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function AutomationRunControls() {
  const [analyticsState, analyticsAction, analyticsPending] = useActionState(async (_: State, formData: FormData) => refreshAnalyticsAction(formData), initialState);
  const [timetableState, timetableAction, timetablePending] = useActionState(async () => optimizeTimetableAction(), initialState);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={analyticsAction} className="portal-subtle-card rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="portal-icon-tile portal-tone-blue size-11 rounded-lg"><BrainCircuit className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-[var(--portal-text)]">Refresh Student 360 analytics</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--portal-muted)]">Writes learner risk snapshots and opens support tasks for amber or red learners.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label>Term label</Label>
            <Input name="term" defaultValue="Term 1" />
          </div>
          <Button type="submit" disabled={analyticsPending}>{analyticsPending ? "Refreshing..." : "Refresh analytics"}</Button>
        </div>
        {analyticsState.message ? <p className={`mt-3 text-sm font-black ${analyticsState.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{analyticsState.message}</p> : null}
      </form>

      <form action={timetableAction} className="portal-subtle-card rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="portal-icon-tile portal-tone-amber size-11 rounded-lg"><CalendarClock className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-[var(--portal-text)]">Scan timetable conflicts</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--portal-muted)]">Checks classroom, teacher, and room overlaps, then creates a resolution task when needed.</p>
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={timetablePending}>{timetablePending ? "Scanning..." : "Run conflict scan"}</Button>
        {timetableState.message ? <p className={`mt-3 text-sm font-black ${timetableState.ok ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{timetableState.message}</p> : null}
      </form>
    </div>
  );
}
