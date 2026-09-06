import Link from "next/link";
import { ArrowRight, BedDouble, ClipboardCheck, DoorOpen, House, ShieldAlert, UserRoundCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function BoardingOverview() {
  const [houses, dormitories, assignments, rollCalls, exeats, incidents, visitors] = await Promise.all([
    loadOperationsModule("boarding", "houses"),
    loadOperationsModule("boarding", "dormitories"),
    loadOperationsModule("boarding", "assignments"),
    loadOperationsModule("boarding", "roll-call"),
    loadOperationsModule("boarding", "exeats"),
    loadOperationsModule("boarding", "incidents"),
    loadOperationsModule("boarding", "visitors")
  ]);
  if (!houses || !dormitories || !assignments || !rollCalls || !exeats || !incidents || !visitors) return null;

  const present = rollCalls.records.filter((record) => ["present", "late"].includes(String(record.status))).length;
  const openExeats = exeats.records.filter((record) => !["returned", "declined", "closed"].includes(String(record.status))).length;
  const openIncidents = incidents.records.filter((record) => !["closed", "resolved"].includes(String(record.status))).length;
  const links = [
    { href: "/boarding/houses", label: "Houses", description: "Manage houses, house parents, capacity, and status.", icon: House },
    { href: "/boarding/dormitories", label: "Dormitories", description: "Review occupancy, beds, capacity, and maintenance state.", icon: BedDouble },
    { href: "/boarding/assignments", label: "Student assignments", description: "Keep learner house and bed assignments current.", icon: Users },
    { href: "/boarding/roll-call", label: "Roll call", description: "Record morning, afternoon, evening, and night checks.", icon: UserRoundCheck },
    { href: "/boarding/exeats", label: "Exeats", description: "Track departures, approvals, destinations, and returns.", icon: DoorOpen },
    { href: "/boarding/incidents", label: "Incidents", description: "Follow health, safety, discipline, and maintenance cases.", icon: ShieldAlert }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Houses</span><strong>{houses.count}</strong><p>Configured boarding houses</p></div>
        <div className="ref-stat"><span>Boarders assigned</span><strong>{assignments.count}</strong><p>Current assignment records</p></div>
        <div className="ref-stat"><span>Roll calls present</span><strong>{present}</strong><p>{rollCalls.count} checks recorded</p></div>
        <div className="ref-stat"><span>Open follow-ups</span><strong>{openExeats + openIncidents}</strong><p>{openExeats} exeats and {openIncidents} incidents</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4"><span className="ref-avatar"><Icon className="size-5" aria-hidden /></span><ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden /></div>
            <h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2><p className="mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Boarding roll call</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Record a protected roll-call check by student ID and time block.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="boarding" moduleKey="roll-call" moduleLabel="roll-call" fields={rollCalls.module.createFields ?? []} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Recent incidents</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search sensitive boarding incidents by student, category, or status.</p></CardHeader><CardContent>{incidents.records.length ? <OperationsGenericTable records={incidents.records.slice(0, 12)} fields={incidents.module.fields} searchFields={incidents.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No boarding incidents have been recorded.</p>}</CardContent></Card>
      </section>

      <Card><CardHeader><CardTitle>Boarding register health</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Dormitories, visitors, and exeats remain connected to the same operational workspace.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Link className="ref-button ref-button-secondary" href="/boarding/dormitories"><BedDouble className="size-4" aria-hidden />{dormitories.count} dormitories</Link><Link className="ref-button ref-button-secondary" href="/boarding/exeats"><DoorOpen className="size-4" aria-hidden />{exeats.count} exeats</Link><Link className="ref-button ref-button-secondary" href="/boarding/visitors"><ClipboardCheck className="size-4" aria-hidden />{visitors.count} visitor records</Link></div></CardContent></Card>
    </div>
  );
}
