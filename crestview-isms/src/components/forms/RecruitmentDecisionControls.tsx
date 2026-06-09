"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { bulkDecideJobApplicationsAction, decideJobApplicationAction } from "@/features/recruitment/actions";
import type { SelectOption } from "@/features/admin/queries";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

const roleOptions = [
  ["teacher", "Teacher"],
  ["hr_staff", "HR staff"],
  ["finance_officer", "Finance officer"],
  ["librarian", "Librarian"],
  ["it_support", "IT support"]
];

export function RecruitmentDecisionControls({ applicationId, classrooms = [] }: { applicationId: string; classrooms?: SelectOption[] }) {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => decideJobApplicationAction(formData), initialState);

  return (
    <form action={action} className="flex min-w-64 flex-col gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select name="role" defaultValue="teacher" className="h-9 text-xs">
        {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Select name="classroomId" defaultValue="" className="h-9 text-xs">
        <option value="">No class assignment yet</option>
        {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
      </Select>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" name="decision" value="accept" disabled={pending}><CheckCircle2 className="size-4" aria-hidden />Accept</Button>
        <Button size="sm" variant="danger" type="submit" name="decision" value="deny" disabled={pending}><XCircle className="size-4" aria-hidden />Deny</Button>
      </div>
      {state.message ? <p className={`text-xs font-bold ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}

export function BulkRecruitmentDecisionControls() {
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => bulkDecideJobApplicationsAction(formData), initialState);

  return (
    <form action={action} className="portal-subtle-card flex flex-col items-start gap-3 rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="accept" disabled={pending}><CheckCircle2 className="size-4" aria-hidden />Accept all waiting</Button>
        <Button type="submit" variant="danger" name="decision" value="deny" disabled={pending}><XCircle className="size-4" aria-hidden />Deny all waiting</Button>
      </div>
      {state.message ? <p className={`text-sm font-bold ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
    </form>
  );
}
