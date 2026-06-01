"use client";

import { useActionState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendPortalAccessAction, updatePortalAccountAction, type AccessActionState } from "@/features/access/actions";

const initialState: AccessActionState = { ok: false, message: "" };

const roles = [
  ["super_admin", "Head administrator"],
  ["school_admin", "School administrator"],
  ["teacher", "Teacher"],
  ["student", "Student"],
  ["parent", "Parent or guardian"],
  ["hr_staff", "HR staff"],
  ["finance_officer", "Finance officer"],
  ["librarian", "Librarian"],
  ["it_support", "IT support"]
] as const;

export function PortalAccountControls({ accountId, role, status, isSelf }: { accountId: string; role: string; status: string; isSelf: boolean }) {
  const [updateState, updateAction, updating] = useActionState(updatePortalAccountAction, initialState);
  const [resendState, resendAction, resending] = useActionState(resendPortalAccessAction, initialState);

  return (
    <div className="min-w-64 space-y-2">
      <form action={updateAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="accountId" value={accountId} />
        <select name="role" defaultValue={role} disabled={isSelf} className="h-9 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-2 text-xs text-[var(--portal-text)]">
          {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="status" defaultValue={status === "disabled" ? "disabled" : "active"} disabled={isSelf} className="h-9 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-2 text-xs text-[var(--portal-text)]">
          <option value="active">Active</option>
          <option value="disabled">Suspended</option>
        </select>
        <Button type="submit" size="sm" disabled={isSelf || updating}><Save className="size-3.5" aria-hidden />Save</Button>
      </form>
      <form action={resendAction}>
        <input type="hidden" name="accountId" value={accountId} />
        <Button type="submit" variant="secondary" size="sm" disabled={resending || status === "disabled"}><RefreshCw className="size-3.5" aria-hidden />{resending ? "Sending..." : "Resend access"}</Button>
      </form>
      {updateState.message ? <p className={`text-xs ${updateState.ok ? "text-emerald-400" : "text-red-400"}`}>{updateState.message}</p> : null}
      {resendState.message ? <p className={`text-xs ${resendState.ok ? "text-emerald-400" : "text-red-400"}`}>{resendState.message}</p> : null}
    </div>
  );
}
