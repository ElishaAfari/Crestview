import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { loadOperationsModule } from "@/features/operations/queries";

export async function HrLeaveWorkspace() {
  const requests = await loadOperationsModule("hr", "leave");
  if (!requests) return null;
  const pending = requests.records.filter((record) => String(record.status) === "pending").length;
  const approved = requests.records.filter((record) => String(record.status) === "approved").length;
  const declined = requests.records.filter((record) => ["declined", "rejected"].includes(String(record.status))).length;
  return <div className="reference-workspace space-y-6"><div className="ref-actions"><Link className="ref-button ref-button-secondary" href="/hr"><ArrowLeft className="size-4" aria-hidden />HR overview</Link><Link className="ref-button ref-button-secondary" href="/hr/leave/calendar"><CalendarDays className="size-4" aria-hidden />Leave calendar</Link></div><section className="ref-stats"><div className="ref-stat"><span>Total requests</span><strong>{requests.count}</strong><p>Staff leave register</p></div><div className="ref-stat"><span>Pending review</span><strong>{pending}</strong><p>Needs HR action</p><Clock3 className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div><div className="ref-stat"><span>Approved</span><strong>{approved}</strong><p>Accepted leave requests</p><CheckCircle2 className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div><div className="ref-stat"><span>Declined</span><strong>{declined}</strong><p>Closed without approval</p><XCircle className="absolute right-4 top-4 size-5 text-[var(--portal-accent)]" aria-hidden /></div></section><Card><CardHeader><CardTitle>Leave Requests</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search staff leave requests by type, dates, reason, or status.</p></CardHeader><CardContent><OperationsGenericTable records={requests.records} fields={requests.module.fields} searchFields={requests.module.searchFields} /></CardContent></Card></div>;
}
