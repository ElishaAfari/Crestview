"use client";

import { useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { changeOwnPasswordAction, updateOwnProfileAction } from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = { first_name: string; middle_name: string | null; last_name: string; phone: string | null; email: string; role: string };

function ResultMessage({ result }: { result: { ok: boolean; message: string } | null }) {
  return result ? <p className={`text-sm font-bold ${result.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{result.message}</p> : null;
}

export function AccountSettingsForm({ profile }: { profile: Profile }) {
  const [profileResult, setProfileResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [passwordResult, setPasswordResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingProfile(true); setProfileResult(await updateOwnProfileAction(new FormData(event.currentTarget))); setSavingProfile(false);
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingPassword(true); const result = await changeOwnPasswordAction(new FormData(event.currentTarget)); setPasswordResult(result); setSavingPassword(false); if (result.ok) event.currentTarget.reset();
  }

  return <div className="grid gap-6 xl:grid-cols-2">
    <Card><CardHeader><CardTitle>Personal profile</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Update the details used across your role workspace and school communications.</p></CardHeader><CardContent><form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
      <div><Label>First name</Label><Input name="firstName" defaultValue={profile.first_name} required /></div>
      <div><Label>Middle name</Label><Input name="middleName" defaultValue={profile.middle_name ?? ""} /></div>
      <div><Label>Last name</Label><Input name="lastName" defaultValue={profile.last_name} required /></div>
      <div><Label>Phone</Label><Input name="phone" type="tel" defaultValue={profile.phone ?? ""} /></div>
      <div className="sm:col-span-2"><Label>Sign-in email</Label><Input value={profile.email} readOnly className="bg-[var(--portal-muted-surface)]" /></div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><Button type="submit" disabled={savingProfile}><Save className="size-4" aria-hidden />{savingProfile ? "Saving..." : "Save profile"}</Button><ResultMessage result={profileResult} /></div>
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>Security</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Change your password after verifying the current one. Never share it with another person.</p></CardHeader><CardContent><form onSubmit={savePassword} className="grid gap-4">
      <div><Label>Current password</Label><Input name="currentPassword" type="password" autoComplete="current-password" required /></div>
      <div><Label>New password</Label><Input name="newPassword" type="password" autoComplete="new-password" minLength={10} required /><p className="mt-1 text-xs font-semibold text-[var(--portal-muted)]">Use at least 10 characters.</p></div>
      <div><Label>Confirm new password</Label><Input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={savingPassword}><KeyRound className="size-4" aria-hidden />{savingPassword ? "Updating..." : "Change password"}</Button><ResultMessage result={passwordResult} /></div>
    </form></CardContent></Card>
    <Card className="xl:col-span-2"><CardHeader><CardTitle><ShieldCheck className="mr-2 inline size-5 text-emerald-600" aria-hidden />Access boundaries</CardTitle></CardHeader><CardContent><p className="text-sm font-semibold text-[var(--portal-muted)]">Your current role is <strong className="text-[var(--portal-text)]">{profile.role}</strong>. Institution-wide controls remain limited to the school owner, super admin, and designated school administrators. Teachers see only classes and courses assigned to them.</p></CardContent></Card>
  </div>;
}
