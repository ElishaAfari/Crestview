import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, HeartHandshake, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { loadOperationsModule } from "@/features/operations/queries";

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function FeedingOverview() {
  const [enrollments, payments, adjustments] = await Promise.all([
    loadOperationsModule("feeding", "enrollments"),
    loadOperationsModule("feeding", "payments"),
    loadOperationsModule("feeding", "adjustments")
  ]);
  if (!enrollments || !payments || !adjustments) return null;
  const collected = payments.records.filter((record) => ["paid", "completed"].includes(String(record.status))).reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  const pendingRemit = adjustments.records.filter((record) => String(record.adjustment_type) === "remittance" && String(record.status) !== "completed").reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  const exemptions = adjustments.records.filter((record) => String(record.adjustment_type) === "exemption").length;
  const links = [
    { href: "/feeding/monitor", label: "Daily monitor", description: "Review enrolled learners and today's collections", icon: ClipboardList },
    { href: "/feeding/payments", label: "Payments", description: "Record feeding collections by student ID", icon: WalletCards },
    { href: "/feeding/adjustments", label: "Adjustments", description: "Manage exemptions, pauses, refunds, and remittances", icon: HeartHandshake },
    { href: "/feeding/reports", label: "Reports", description: "Review arrears and collection history", icon: FileText }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Enrolled learners</span><strong>{enrollments.count}</strong><p>Active feeding register</p></div>
        <div className="ref-stat"><span>Collected today</span><strong>{money(collected)}</strong><p>{payments.count} payment records</p></div>
        <div className="ref-stat"><span>Exemptions</span><strong>{exemptions}</strong><p>Recorded service adjustments</p></div>
        <div className="ref-stat"><span>Pending remit</span><strong>{money(pendingRemit)}</strong><p>Needs finance follow-up</p></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {links.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><span className="ref-avatar"><Icon className="size-5" aria-hidden /></span><ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden /></div><h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2><p className="mt-1 text-sm">{description}</p></Link>)}
      </section>
      <Card>
        <CardHeader><CardTitle>Recent feeding payments</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Collections remain separate from daily school fees while using the same student identity and audit trail.</p></CardHeader>
        <CardContent>{payments.records.length ? <OperationsGenericTable records={payments.records.slice(0, 12)} fields={payments.module.fields} searchFields={payments.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No feeding payments have been recorded yet.</p>}</CardContent>
      </Card>
    </div>
  );
}
