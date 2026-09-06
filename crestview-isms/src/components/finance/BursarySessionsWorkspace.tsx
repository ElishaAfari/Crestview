import Link from "next/link";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadOperationsModule } from "@/features/operations/queries";

export async function BursarySessionsWorkspace() {
  const sessions = await loadOperationsModule("bursary", "cashier-sessions");
  if (!sessions) return null;
  const open = sessions.records.filter((record) => String(record.status) === "open").length;
  const closed = sessions.records.filter((record) => ["closed", "reconciled"].includes(String(record.status))).length;

  return (
    <div className="reference-workspace space-y-6">
      <div className="ref-actions"><Link className="ref-button ref-button-secondary" href="/bursary"><ArrowLeft className="size-4" aria-hidden />Cashier desk</Link><a className="ref-button ref-primary" href="#new-session"><Plus className="size-4" aria-hidden />Open session</a><a className="ref-button ref-button-secondary" href="#session-register"><Download className="size-4" aria-hidden />Export view</a></div>
      <section className="ref-stats"><div className="ref-stat"><span>Total sessions</span><strong>{sessions.count}</strong><p>All cashier shifts</p></div><div className="ref-stat"><span>Open shifts</span><strong>{open}</strong><p>Require end-of-shift close</p></div><div className="ref-stat"><span>Closed shifts</span><strong>{closed}</strong><p>Closed or reconciled</p></div></section>
      <Card id="new-session"><CardHeader><CardTitle>Open cashier session</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Opening floats and expected cash are captured before payments begin.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="bursary" moduleKey="cashier-sessions" moduleLabel="Cashier session" fields={sessions.module.createFields ?? []} /></CardContent></Card>
      <Card id="session-register"><CardHeader><CardTitle>Session history</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search, review, and export all cashier shifts.</p></CardHeader><CardContent><OperationsGenericTable records={sessions.records} fields={sessions.module.fields} searchFields={sessions.module.searchFields} /></CardContent></Card>
    </div>
  );
}
