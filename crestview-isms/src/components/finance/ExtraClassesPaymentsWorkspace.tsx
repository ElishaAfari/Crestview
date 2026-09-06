import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function ExtraClassesPaymentsWorkspace() {
  const payments = await loadOperationsModule("extra-classes", "payments");
  if (!payments) return null;
  const total = payments.records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  return <div className="reference-workspace space-y-6"><div className="ref-actions"><Link className="ref-button ref-button-secondary" href="/extra-classes"><ArrowLeft className="size-4" aria-hidden />Extra classes overview</Link><a className="ref-button ref-primary" href="#record-extra-payment"><Plus className="size-4" aria-hidden />Record payment</a></div><section className="ref-stats"><div className="ref-stat"><span>Total payments</span><strong>{payments.count}</strong><p>Extra-class collection records</p></div><div className="ref-stat"><span>Total value</span><strong>GHS {total.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><p>Visible payment register</p></div></section><Card id="record-extra-payment"><CardHeader><CardTitle>Record extra-class payment</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">The server stamps this record with the extra_classes service type.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="extra-classes" moduleKey="payments" moduleLabel="Extra-class payment" fields={payments.module.createFields ?? []} /></CardContent></Card><Card><CardHeader><CardTitle>Collection history</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search by payment number, student ID, date, method, reference, or status.</p></CardHeader><CardContent><OperationsGenericTable records={payments.records} fields={payments.module.fields} searchFields={payments.module.searchFields} /></CardContent></Card></div>;
}
