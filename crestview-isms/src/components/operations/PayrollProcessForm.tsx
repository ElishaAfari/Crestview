"use client";

import { useActionState } from "react";
import { Banknote } from "lucide-react";
import { processPayrollAction } from "@/features/payroll/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function PayrollProcessForm() {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => processPayrollAction(formData), initialState);

  return (
    <form action={action} className="portal-subtle-card mb-4 grid gap-4 rounded-lg p-4 lg:grid-cols-[1fr_0.7fr_0.7fr_auto] lg:items-end">
      <div className="flex items-start gap-3 lg:col-span-4">
        <span className="portal-icon-tile portal-tone-green size-11 rounded-lg"><Banknote className="size-5" aria-hidden /></span>
        <div>
          <h3 className="text-base font-black text-[var(--portal-text)]">Prepare payroll period</h3>
          <p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">Creates the period if missing and adds payroll lines for active staff not already listed.</p>
        </div>
      </div>
      <div>
        <Label>Period name</Label>
        <Input name="name" placeholder="Leave blank for current month payroll" />
      </div>
      <div>
        <Label>Start</Label>
        <Input name="startsOn" type="date" />
      </div>
      <div>
        <Label>End</Label>
        <Input name="endsOn" type="date" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Processing..." : "Process payroll"}</Button>
      {state.message ? <p className={`lg:col-span-4 text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}
