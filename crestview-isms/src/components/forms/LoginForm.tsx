"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/auth/actions";

const initialState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="login-identifier" className="text-slate-700">
          Email, student ID, or staff ID
        </Label>
        <Input
          id="login-identifier"
          required
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="name@school.com, CIS/ST/000001, or CIS/STA0001"
          className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400"
        />
      </div>
      <div>
        <Label htmlFor="login-password" className="text-slate-700">
          Password
        </Label>
        <Input
          id="login-password"
          required
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400"
        />
      </div>
      {state.message ? (
        <p className="text-sm font-medium text-red-700">{state.message}</p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="mt-2 bg-[#cf1017] text-white hover:bg-[#ad0d13]"
      >
        <LogIn className="size-4" aria-hidden />
        {pending ? "Signing in..." : "Open workspace"}
      </Button>
    </form>
  );
}
