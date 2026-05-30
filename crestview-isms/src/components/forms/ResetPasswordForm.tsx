"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "@/features/auth/actions";

const initialState = { ok: false, message: "" };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div><Label className="text-slate-700">New password</Label><Input required name="password" type="password" autoComplete="new-password" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" /></div>
      <div><Label className="text-slate-700">Confirm password</Label><Input required name="confirmPassword" type="password" autoComplete="new-password" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" /></div>
      {state.message ? <p className={`text-sm font-medium ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
      {state.ok ? (
        <Link href="/login" className="rounded-lg bg-[#06165b] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#0a237c]">Return to sign in</Link>
      ) : (
        <Button type="submit" disabled={pending} className="bg-[#cf1017] text-white hover:bg-[#ad0d13]">
          <KeyRound className="size-4" aria-hidden />{pending ? "Updating..." : "Update password"}
        </Button>
      )}
    </form>
  );
}
