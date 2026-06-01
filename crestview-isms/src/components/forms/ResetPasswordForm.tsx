"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState({ ok: false, message: "Validating your secure link..." });

  useEffect(() => {
    let mounted = true;

    async function establishRecoverySession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");
      const linkError = hash.get("error_description");
      let sessionReady = false;

      if (linkError) {
        if (mounted) {
          setReady(true);
          setState({ ok: false, message: decodeURIComponent(linkError.replaceAll("+", " ")) });
        }
        return;
      }

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        sessionReady = Boolean(data.session) && !error;
      } else if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        sessionReady = Boolean(data.session) && !error;
      } else {
        const { data } = await supabase.auth.getSession();
        sessionReady = Boolean(data.session);
      }

      if (!mounted) return;
      if (sessionReady) {
        window.history.replaceState({}, "", window.location.pathname);
        setHasSession(true);
        setState({ ok: false, message: "" });
      } else {
        setState({ ok: false, message: "This secure link is missing or has expired. Ask an administrator to resend access." });
      }
      setReady(true);
    }

    void establishRecoverySession();
    return () => { mounted = false; };
  }, [supabase]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setState({ ok: false, message: "Use at least eight characters." });
      return;
    }
    if (password !== confirmPassword) {
      setState({ ok: false, message: "Passwords do not match." });
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    setState(error
      ? { ok: false, message: "Your password could not be updated. Ask an administrator to resend access." }
      : { ok: true, message: "Password updated. You can now sign in." });
  }

  return (
    <form onSubmit={updatePassword} className="grid gap-4">
      <div><Label className="text-slate-700">New password</Label><Input required disabled={!hasSession} name="password" type="password" autoComplete="new-password" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" /></div>
      <div><Label className="text-slate-700">Confirm password</Label><Input required disabled={!hasSession} name="confirmPassword" type="password" autoComplete="new-password" className="mt-1 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400" /></div>
      {state.message ? <p className={`text-sm font-medium ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
      {state.ok ? (
        <Link href="/login" className="rounded-lg bg-[#06165b] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#0a237c]">Return to sign in</Link>
      ) : (
        <Button type="submit" disabled={!ready || !hasSession || pending} className="bg-[#cf1017] text-white hover:bg-[#ad0d13]">
          <KeyRound className="size-4" aria-hidden />{pending ? "Updating..." : ready ? "Update password" : "Validating link..."}
        </Button>
      )}
    </form>
  );
}
