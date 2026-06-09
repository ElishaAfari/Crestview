"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateGradingScaleAction } from "@/features/grades/actions";
import type { GradingScaleRow } from "@/features/admin/queries";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

function ScaleRowForm({ row }: { row: GradingScaleRow }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => updateGradingScaleAction(formData), initialState);

  return (
    <form action={action} className="portal-subtle-card grid gap-3 rounded-lg p-3 lg:grid-cols-[0.45fr_0.7fr_0.7fr_1fr_0.8fr_auto] lg:items-start">
      <input type="hidden" name="scaleId" value={row.id} />
      <div>
        <p className="text-xs font-black uppercase text-[var(--portal-muted)]">Grade</p>
        <p className="mt-2 text-lg font-black text-[var(--portal-text)]">{row.code}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-black uppercase text-[var(--portal-muted)]">Min %</p>
        <Input name="minPercentage" type="number" min="0" max="100" step="0.01" defaultValue={row.minPercentage} />
      </div>
      <div>
        <p className="mb-1 text-xs font-black uppercase text-[var(--portal-muted)]">Max %</p>
        <Input name="maxPercentage" type="number" min="0" max="100" step="0.01" defaultValue={row.maxPercentage} />
      </div>
      <div>
        <p className="mb-1 text-xs font-black uppercase text-[var(--portal-muted)]">Remark</p>
        <Input name="remark" defaultValue={row.remark} />
      </div>
      <div>
        <p className="mb-1 text-xs font-black uppercase text-[var(--portal-muted)]">Result</p>
        <Select name="isPassing" defaultValue={row.isPassing ? "true" : "false"}>
          <option value="true">Passing</option>
          <option value="false">Failing</option>
        </Select>
      </div>
      <div>
        <Button size="sm" type="submit" disabled={pending}><Save className="size-4" aria-hidden />Save</Button>
        {state.message ? <p className={`mt-2 text-xs font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}

export function GradingScaleManager({ scales = [] }: { scales?: GradingScaleRow[] }) {
  if (!scales.length) return <p className="text-sm font-bold text-[var(--portal-muted)]">No grading scale has been configured yet.</p>;

  return (
    <div className="space-y-3">
      {scales.map((row) => <ScaleRowForm key={row.id} row={row} />)}
    </div>
  );
}
