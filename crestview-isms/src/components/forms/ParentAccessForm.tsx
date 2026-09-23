"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestParentAccessAction } from "@/features/auth/actions";

const initialState = { ok: false, message: "" };

export function ParentAccessForm() {
  const [state, action, pending] = useActionState(
    requestParentAccessAction,
    initialState,
  );
  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="parent-student-number">Ward&apos;s student ID</Label>
        <Input
          id="parent-student-number"
          name="studentNumber"
          required
          placeholder="CIS/ST/000001"
          autoComplete="off"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="parent-email">Guardian email</Label>
        <Input
          id="parent-email"
          name="email"
          required
          type="email"
          autoComplete="email"
          className="mt-1"
        />
      </div>
      {state.message ? (
        <p
          className={`text-sm font-semibold ${state.ok ? "text-emerald-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="bg-[#cf1017] text-white hover:bg-[#ad0d13]"
      >
        <KeyRound className="size-4" aria-hidden />
        {pending ? "Checking details..." : "Send secure access link"}
      </Button>
    </form>
  );
}
