import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, HeartPulse, NotebookPen, ShieldCheck, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function LearnerCareOverview() {
  const [cases, behaviour, medical, notes] = await Promise.all([
    loadOperationsModule("learner-care", "wellbeing-cases"),
    loadOperationsModule("learner-care", "behaviour"),
    loadOperationsModule("learner-care", "medical"),
    loadOperationsModule("learner-care", "student-360-notes")
  ]);
  if (!cases || !behaviour || !medical || !notes) return null;

  const redCases = cases.records.filter((record) => String(record.risk_level) === "red").length;
  const amberCases = cases.records.filter((record) => String(record.risk_level) === "amber").length;
  const openCases = cases.records.filter((record) => !["closed", "resolved"].includes(String(record.status))).length;
  const links = [
    { href: "/learner-care/wellbeing-cases", label: "Wellbeing cases", description: "Open and follow protected learner-support cases.", icon: HeartPulse },
    { href: "/learner-care/behaviour", label: "Behaviour records", description: "Record positive, disciplinary, and safeguarding events.", icon: ShieldCheck },
    { href: "/learner-care/medical", label: "Medical notes", description: "Keep health-sensitive records available to authorised staff.", icon: Stethoscope },
    { href: "/learner-care/student-360-notes", label: "Student 360 notes", description: "Connect academic, attendance, finance, and parent follow-up notes.", icon: NotebookPen },
    { href: "/admin/student-360", label: "Student 360", description: "Review the connected learner intelligence register.", icon: Activity },
    { href: "/teacher/student-360", label: "Class support", description: "Open the teacher-scoped support workspace.", icon: AlertTriangle }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Open support cases</span><strong>{openCases}</strong><p>{cases.count} wellbeing records total</p></div>
        <div className="ref-stat"><span>Red risk</span><strong>{redCases}</strong><p>Requires immediate review</p></div>
        <div className="ref-stat"><span>Amber risk</span><strong>{amberCases}</strong><p>Needs active monitoring</p></div>
        <div className="ref-stat"><span>Care records</span><strong>{behaviour.count + medical.count + notes.count}</strong><p>Behaviour, health, and 360 notes</p></div>
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
        <Card><CardHeader><CardTitle>Open a care case</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Create a risk-aware learner support record with an action plan.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="learner-care" moduleKey="wellbeing-cases" moduleLabel="wellbeing case" fields={cases.module.createFields ?? []} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Care register</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search current cases by learner, category, risk, or status.</p></CardHeader><CardContent>{cases.records.length ? <OperationsGenericTable records={cases.records.slice(0, 12)} fields={cases.module.fields} searchFields={cases.module.searchFields} /> : <div className="portal-empty-state"><h3>No wellbeing cases</h3><p>Care staff can open the first protected learner support case above.</p></div>}</CardContent></Card>
      </section>

      <Card><CardHeader><CardTitle>Connected learner care</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Support information stays linked to the appropriate Student 360 and teacher-scoped workflows.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Link className="ref-button ref-button-secondary" href="/learner-care/behaviour"><ShieldCheck className="size-4" aria-hidden />{behaviour.count} behaviour records</Link><Link className="ref-button ref-button-secondary" href="/learner-care/medical"><Stethoscope className="size-4" aria-hidden />{medical.count} medical notes</Link><Link className="ref-button ref-button-secondary" href="/learner-care/student-360-notes"><NotebookPen className="size-4" aria-hidden />{notes.count} 360 notes</Link></div></CardContent></Card>
    </div>
  );
}
