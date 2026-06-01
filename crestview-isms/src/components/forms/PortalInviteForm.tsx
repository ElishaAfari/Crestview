"use client";

import { useActionState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitePortalUserAction } from "@/features/access/actions";
import type { AccessActionState } from "@/features/access/actions";

const initialState = { ok: false, message: "" };

export function PortalInviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (previousState: AccessActionState, formData: FormData) => {
    const result = await invitePortalUserAction(previousState, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input required name="firstName" /></div>
      <div><Label>Last name</Label><Input required name="lastName" /></div>
      <div><Label>Email</Label><Input required name="email" type="email" /></div>
      <div>
        <Label>Portal role</Label>
        <select name="role" defaultValue="teacher" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30">
          <option value="school_admin">School administrator</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student beta account</option>
          <option value="parent">Parent beta account</option>
          <option value="hr_staff">HR staff</option>
          <option value="finance_officer">Finance officer</option>
          <option value="librarian">Librarian</option>
          <option value="it_support">IT support</option>
        </select>
      </div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending}>
          <Send className="size-4" aria-hidden />{pending ? "Creating account..." : "Create user and send access"}
        </Button>
        {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-300" : "text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
