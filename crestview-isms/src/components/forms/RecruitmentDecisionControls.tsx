"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkDecideJobApplicationsAction, decideJobApplicationAction } from "@/features/recruitment/actions";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function RecruitmentDecisionControls({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => decideJobApplicationAction(formData), initialState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" name="decision" value="accept" disabled={pending}><CheckCircle2 className="size-4" aria-hidden />Accept</Button>
        <Button size="sm" variant="danger" type="submit" name="decision" value="deny" disabled={pending}><XCircle className="size-4" aria-hidden />Deny</Button>
      </div>
      {state.message ? <p className={`text-xs ${state.ok ? "text-emerald-300" : "text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

export function BulkRecruitmentDecisionControls() {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => bulkDecideJobApplicationsAction(formData), initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-3 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="accept" disabled={pending}><CheckCircle2 className="size-4" aria-hidden />Accept all waiting</Button>
        <Button type="submit" variant="danger" name="decision" value="deny" disabled={pending}><XCircle className="size-4" aria-hidden />Deny all waiting</Button>
      </div>
      {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}
