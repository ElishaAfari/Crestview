import Link from "next/link";
import { ArrowRight, BookOpenCheck, Building2, FileText, Landmark, Scale } from "lucide-react";
import { loadOperationsWorkspace } from "@/features/operations/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function AccountingOverview() {
  const workspace = await loadOperationsWorkspace("accounting");
  if (!workspace) return null;
  const byKey = new Map(workspace.modules.map((module) => [module.key, module]));
  const quickLinks = [
    { key: "chart-of-accounts", label: "Chart of accounts", description: "Maintain account codes and categories", icon: Scale },
    { key: "fiscal-years", label: "Fiscal years", description: "Open, close, and lock accounting periods", icon: BookOpenCheck },
    { key: "journals", label: "Journal entries", description: "Review double-entry posting records", icon: FileText },
    { key: "supplier-bills", label: "Supplier bills", description: "Track vendor obligations and approvals", icon: Building2 },
    { key: "bank-accounts", label: "Bank accounts", description: "Reconcile school and mobile-money accounts", icon: Landmark }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Live registers</span><strong>{workspace.modules.length}</strong><p>Connected accounting modules</p></div>
        <div className="ref-stat"><span>Chart accounts</span><strong>{byKey.get("chart-of-accounts")?.count ?? 0}</strong><p>Configured accounts</p></div>
        <div className="ref-stat"><span>Journal entries</span><strong>{byKey.get("journals")?.count ?? 0}</strong><p>Manual and automated postings</p></div>
        <div className="ref-stat"><span>Supplier bills</span><strong>{byKey.get("supplier-bills")?.count ?? 0}</strong><p>Payables register</p></div>
      </section>
      <Card>
        <CardHeader><CardTitle>Accounting control centre</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Double-entry general ledger, reports, and financial dashboards connected to the finance and bursary records.</p></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ key, label, description, icon: Icon }) => {
            const register = byKey.get(key);
            return <Link key={key} href={`/accounting/${key}`} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><span className="ref-avatar"><Icon className="size-5" aria-hidden /></span><ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden /></div><h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2><p className="mt-1 text-sm">{description}</p><p className="mt-4 text-xs font-black uppercase tracking-wider text-[var(--portal-muted)]">{register?.count ?? 0} records</p></Link>;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
