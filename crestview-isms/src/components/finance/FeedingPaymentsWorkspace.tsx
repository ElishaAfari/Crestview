import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function FeedingPaymentsWorkspace() {
  const payments = await loadOperationsModule("feeding", "payments");
  if (!payments) return null;
  const total = payments.records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions"><Link className="ref-button ref-button-secondary" href="/feeding"><ArrowLeft className="size-4" aria-hidden />Feeding overview</Link><a className="ref-button ref-primary" href="#record-feeding-payment"><Plus className="size-4" aria-hidden />Record payment</a></div>
      <section className="ref-stats"><div className="ref-stat"><span>Total payments</span><strong>{payments.count}</strong><p>Feeding collection records</p></div><div className="ref-stat"><span>Total value</span><strong>GHS {total.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><p>Visible payment register</p></div></section>
      <Card id="record-feeding-payment"><CardHeader><CardTitle>Record feeding payment</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Use the student number, amount, method, and receipt reference. The server adds the feeding service type.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="feeding" moduleKey="payments" moduleLabel="Feeding payment" fields={payments.module.createFields ?? []} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Collection history</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search by payment number, student ID, date, method, reference, or status.</p></CardHeader><CardContent><OperationsGenericTable records={payments.records} fields={payments.module.fields} searchFields={payments.module.searchFields} /></CardContent></Card>
    </div>
  );
}
