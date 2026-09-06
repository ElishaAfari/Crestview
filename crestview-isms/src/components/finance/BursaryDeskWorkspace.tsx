import Link from "next/link";
import { ArrowRight, Banknote, ClipboardCheck, ReceiptText } from "lucide-react";
import { DailyFeePaymentForm } from "@/components/forms/DailyFeePaymentForm";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadOperationsModule } from "@/features/operations/queries";

function money(value: number) {
  return `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function BursaryDeskWorkspace() {
  const [sessions, receipts] = await Promise.all([
    loadOperationsModule("bursary", "cashier-sessions"),
    loadOperationsModule("bursary", "receipts")
  ]);
  if (!sessions || !receipts) return null;
  const openSessions = sessions.records.filter((record) => ["open", "flagged"].includes(String(record.status))).length;
  const collected = receipts.records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0);
  const recentReceipts = receipts.records.slice(0, 8);
  const currentSession = sessions.records.find((record) => String(record.status) === "open");

  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions">
        <Link className="ref-button ref-primary" href="#fee-payment"><Banknote className="size-4" aria-hidden />Fee payment</Link>
        <Link className="ref-button ref-button-secondary" href="/bursary/sessions"><ClipboardCheck className="size-4" aria-hidden />Cashier sessions</Link>
        <Link className="ref-button ref-button-secondary" href="/bursary/receipts"><ReceiptText className="size-4" aria-hidden />Receipts</Link>
      </div>
      <section className="ref-stats">
        <div className="ref-stat"><span>Cashier status</span><strong>{openSessions ? "Open" : "Ready"}</strong><p>{currentSession ? `Session ${String(currentSession.session_number ?? "")}` : "Open a shift to begin"}</p></div>
        <div className="ref-stat"><span>Open shifts</span><strong>{openSessions}</strong><p>Unclosed cashier sessions</p></div>
        <div className="ref-stat"><span>Receipts</span><strong>{receipts.count}</strong><p>Recent bursary records</p></div>
        <div className="ref-stat"><span>Total recorded</span><strong>{money(collected)}</strong><p>Across visible receipts</p></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Cashier Desk</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Open a shift, set the float, and keep the cash desk traceable from receipt to reconciliation.</p></CardHeader>
          <CardContent><OperationsRecordForm workspaceKey="bursary" moduleKey="cashier-sessions" moduleLabel="Cashier session" fields={sessions.module.createFields ?? []} /></CardContent>
        </Card>
        <Card id="fee-payment">
          <CardHeader><CardTitle>Record Fee Payment</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Use the student QR code or eight-digit ID to record a protected daily payment.</p></CardHeader>
          <CardContent><DailyFeePaymentForm /></CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader><CardTitle>Recent Receipts</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search and review the latest bursary receipts without leaving the cashier desk.</p></CardHeader>
        <CardContent>
          {recentReceipts.length ? <OperationsGenericTable records={recentReceipts} fields={receipts.module.fields} searchFields={receipts.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No receipts have been recorded in this shift.</p>}
          <Link href="/bursary/receipts" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-200">View full receipt register <ArrowRight className="size-4" aria-hidden /></Link>
        </CardContent>
      </Card>
    </div>
  );
}
