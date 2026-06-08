import { ExternalLink, ShieldCheck, UserRoundCog } from "lucide-react";
import Link from "next/link";
import { PortalAccountControls } from "@/components/forms/PortalAccountControls";
import { PortalInviteForm } from "@/components/forms/PortalInviteForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleExperiences } from "@/config/role-experiences";
import { listPortalAccounts } from "@/features/access/queries";

export default async function AdminAccessPage() {
  const accounts = await listPortalAccounts();

  return (
    <PageWrapper title="User Management" description="Create portal accounts, assign role-specific workspaces, resend secure onboarding, and suspend access from one directory.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Create portal user</CardTitle></CardHeader>
          <CardContent>
            <PortalInviteForm />
            <p className="mt-5 text-xs leading-5 text-[var(--portal-muted)]">The assigned role takes effect immediately. The user receives a secure email to choose a password and enter their workspace.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Account directory</CardTitle></CardHeader>
          <CardContent>
            {accounts.length ? (
              <div className="overflow-x-auto rounded-lg border border-[var(--portal-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--portal-surface-strong)] text-xs uppercase text-[var(--portal-muted)]"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Home</th><th className="px-4 py-3">Controls</th></tr></thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-t border-[var(--portal-border)]">
                        <td className="px-4 py-3"><p className="font-medium text-[var(--portal-text)]">{account.name}</p><p className="text-xs text-[var(--portal-muted)]">{account.email}</p></td>
                        <td className="px-4 py-3 text-[var(--portal-text)]">{account.role}</td>
                        <td className="px-4 py-3"><StatusBadge status={account.status} /></td>
                        <td className="px-4 py-3"><Link href={account.home} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-200">{account.home}<ExternalLink className="size-3" aria-hidden /></Link></td>
                        <td className="px-4 py-3"><PortalAccountControls accountId={account.id} role={account.roleName} status={account.status} isSelf={account.isSelf} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-[var(--portal-muted)]">No portal accounts yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Role experience map</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleExperiences.map((experience) => (
              <article key={experience.role} className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-4">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200"><ShieldCheck className="size-4" aria-hidden /><p className="text-xs font-bold uppercase">{experience.label}</p></div>
                <p className="mt-3 text-sm leading-6 text-[var(--portal-text)]">{experience.summary}</p>
                <div className="mt-4 grid gap-1.5">{experience.access.map((item) => <p key={item} className="flex items-center gap-2 text-xs text-[var(--portal-muted)]"><UserRoundCog className="size-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden />{item}</p>)}</div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
