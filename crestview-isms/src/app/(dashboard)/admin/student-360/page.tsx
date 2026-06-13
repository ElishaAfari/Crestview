import { PageWrapper } from "@/components/layout/PageWrapper";
import { Student360Table } from "@/components/tables/Student360Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudent360Overview, listWorkflowTasksForCurrentRole } from "@/features/automation/queries";

export default async function AdminStudent360Page() {
  const [students, tasks] = await Promise.all([listStudent360Overview(), listWorkflowTasksForCurrentRole(40)]);
  const atRisk = students.filter((student) => student.risk !== "green").length;
  const openInvoices = students.reduce((sum, student) => sum + student.openInvoices, 0);
  const averageAttendance = students.length ? Math.round(students.reduce((sum, student) => sum + student.attendanceRate, 0) / students.length) : 0;
  const academicAlerts = students.reduce((sum, student) => sum + student.lowGrades, 0);

  return (
    <PageWrapper title="Student 360" description="A single, connected view of each learner's attendance, grades, reports, finance exposure, notes, and follow-up tasks.">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Students", students.length, "portal-accent-blue", "portal-tone-blue"],
          ["Needs support", atRisk, "portal-accent-red", "portal-tone-red"],
          ["Attendance", `${averageAttendance}%`, "portal-accent-green", "portal-tone-green"],
          ["Academic alerts", academicAlerts, "portal-accent-amber", "portal-tone-amber"]
        ].map(([label, value, accent, tone]) => (
          <Card key={String(label)} className={`portal-metric-card ${accent} overflow-hidden`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--portal-muted)]">{label}</p>
                  <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
                </div>
                <span className={`portal-icon-tile ${tone} size-12 rounded-lg`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Learner Intelligence Register</CardTitle></CardHeader>
        <CardContent><Student360Table data={students} /></CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle>Open Student Follow-Ups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.filter((task) => task.student !== "Not linked").slice(0, 8).map((task) => (
                <div key={task.id} className="portal-subtle-card rounded-lg p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[var(--portal-text)]">{task.title}</p>
                      <p className="text-xs font-semibold text-[var(--portal-muted)]">{task.student} | {task.workflowKey} | {task.dueAt}</p>
                    </div>
                    <p className="text-xs font-black uppercase text-[var(--portal-text)]">{task.priority}</p>
                  </div>
                </div>
              ))}
              {!tasks.some((task) => task.student !== "Not linked") ? <p className="text-sm font-bold text-[var(--portal-muted)]">No linked student tasks yet.</p> : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Finance Exposure</CardTitle></CardHeader>
          <CardContent>
            <div className="portal-brand-card rounded-lg p-5">
              <p className="text-sm font-black uppercase text-white/80">Open invoices across learners</p>
              <p className="mt-2 font-heading text-4xl font-black text-white">{openInvoices}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/85">Use this with Fees and Automation Center to chase class billing, overdue invoices, and parent follow-up tasks.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageWrapper>
  );
}
