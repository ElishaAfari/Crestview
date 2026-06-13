import { PageWrapper } from "@/components/layout/PageWrapper";
import { Student360Table } from "@/components/tables/Student360Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudent360Overview } from "@/features/automation/queries";
import { BarChart3, GraduationCap, ShieldAlert } from "lucide-react";

export default async function TeacherStudent360Page() {
  const students = await listStudent360Overview();
  const atRisk = students.filter((student) => student.risk !== "green").length;
  const average = students.length ? Math.round(students.reduce((sum, student) => sum + student.gradeAverage, 0) / students.length) : 0;

  return (
    <PageWrapper title="Class Student 360" description="Teacher-only learner intelligence for assigned classes, combining attendance, grades, reports, notes, and support signals.">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Learners", value: students.length, accent: "portal-accent-blue", tone: "portal-tone-blue", icon: GraduationCap },
          { label: "Need support", value: atRisk, accent: "portal-accent-red", tone: "portal-tone-red", icon: ShieldAlert },
          { label: "Class average", value: `${average}%`, accent: "portal-accent-green", tone: "portal-tone-green", icon: BarChart3 }
        ].map(({ label, value, accent, tone, icon: Icon }) => (
          <Card key={label} className={`portal-metric-card ${accent} overflow-hidden`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--portal-muted)]">{label}</p>
                  <p className="mt-2 font-heading text-3xl font-black text-[var(--portal-text)]">{value}</p>
                </div>
                <span className={`portal-icon-tile ${tone} size-12 rounded-lg`}>
                  <Icon className="size-5 stroke-[2.5]" aria-hidden />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader><CardTitle>Assigned Learner Intelligence</CardTitle></CardHeader>
        <CardContent><Student360Table data={students} profileBasePath="/teacher/student-360" /></CardContent>
      </Card>
    </PageWrapper>
  );
}
