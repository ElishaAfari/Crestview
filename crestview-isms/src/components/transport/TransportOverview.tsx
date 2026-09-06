import Link from "next/link";
import { ArrowRight, BusFront, ClipboardList, MapPinned, Route, UserRound, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function TransportOverview() {
  const [routes, vehicles, stops, trips, assignments] = await Promise.all([
    loadOperationsModule("transport", "routes"),
    loadOperationsModule("transport", "vehicles"),
    loadOperationsModule("transport", "stops"),
    loadOperationsModule("transport", "trips"),
    loadOperationsModule("transport", "assignments")
  ]);
  if (!routes || !vehicles || !stops || !trips || !assignments) return null;

  const activeVehicles = vehicles.records.filter((record) => String(record.status ?? "active") === "active").length;
  const completedTrips = trips.records.filter((record) => String(record.status) === "completed").length;
  const links = [
    { href: "/transport/routes", label: "Routes", description: "Organise route names, vehicles, and service areas.", icon: Route },
    { href: "/transport/vehicles", label: "Vehicles", description: "Track registration, capacity, insurance, and roadworthiness.", icon: BusFront },
    { href: "/transport/stops", label: "Stops", description: "Maintain pickup and drop-off sequence and times.", icon: MapPinned },
    { href: "/transport/trips", label: "Trip logs", description: "Record daily pickup and drop-off execution.", icon: ClipboardList },
    { href: "/transport/assignments", label: "Student assignments", description: "Connect learners to valid routes and dates.", icon: UserRound },
    { href: "/transport/maintenance", label: "Vehicle care", description: "Open fleet maintenance and readiness follow-up.", icon: Wrench }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Active routes</span><strong>{routes.count}</strong><p>Configured transport routes</p></div>
        <div className="ref-stat"><span>Active vehicles</span><strong>{activeVehicles}</strong><p>{vehicles.count} fleet records</p></div>
        <div className="ref-stat"><span>Student assignments</span><strong>{assignments.count}</strong><p>Learners linked to transport</p></div>
        <div className="ref-stat"><span>Completed trips</span><strong>{completedTrips}</strong><p>{trips.count} trip logs in view</p></div>
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
        <Card><CardHeader><CardTitle>Record trip</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Log pickup or drop-off progress for today&apos;s transport service.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="transport" moduleKey="trips" moduleLabel="trip" fields={trips.module.createFields ?? []} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Recent trip logs</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search execution history by direction, status, or notes.</p></CardHeader><CardContent>{trips.records.length ? <OperationsGenericTable records={trips.records.slice(0, 12)} fields={trips.module.fields} searchFields={trips.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No trip logs have been recorded yet.</p>}</CardContent></Card>
      </section>

      <Card><CardHeader><CardTitle>Route network</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Stops and learner assignments provide the operational detail behind every route.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Link className="ref-button ref-button-secondary" href="/transport/routes"><Route className="size-4" aria-hidden />{routes.count} routes</Link><Link className="ref-button ref-button-secondary" href="/transport/stops"><MapPinned className="size-4" aria-hidden />{stops.count} stops</Link><Link className="ref-button ref-button-secondary" href="/transport/assignments"><UserRound className="size-4" aria-hidden />{assignments.count} assignments</Link></div></CardContent></Card>
    </div>
  );
}
