"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapHeadAdminAction } from "@/features/access/actions";

const initialState = { ok: false, message: "" };
const fieldClassName = "mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400";

export function BootstrapAdminForm() {
  const [state, action, pending] = useActionState(bootstrapHeadAdminAction, initialState);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div><Label className="text-slate-700">First name</Label><Input required name="firstName" className={fieldClassName} /></div>
      <div><Label className="text-slate-700">Last name</Label><Input required name="lastName" className={fieldClassName} /></div>
      <div className="sm:col-span-2"><Label className="text-slate-700">Email</Label><Input required name="email" type="email" autoComplete="email" className={fieldClassName} /></div>
      <div><Label className="text-slate-700">Password</Label><Input required name="password" type="password" autoComplete="new-password" className={fieldClassName} /></div>
      <div><Label className="text-slate-700">Confirm password</Label><Input required name="confirmPassword" type="password" autoComplete="new-password" className={fieldClassName} /></div>
      <div className="sm:col-span-2"><Label className="text-slate-700">One-time setup code</Label><Input required name="setupCode" type="password" autoComplete="off" className={fieldClassName} /></div>
      {state.message ? <p className={`sm:col-span-2 text-sm font-medium ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
      {state.ok ? (
        <Link href="/login" className="sm:col-span-2 rounded-lg bg-[#06165b] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#0a237c]">
          Continue to sign in
        </Link>
      ) : (
        <Button type="submit" disabled={pending} className="sm:col-span-2 bg-[#cf1017] text-white hover:bg-[#ad0d13]">
          {pending ? <KeyRound className="size-4" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
          {pending ? "Creating account..." : "Create head administrator account"}
        </Button>
      )}
    </form>
  );
}
