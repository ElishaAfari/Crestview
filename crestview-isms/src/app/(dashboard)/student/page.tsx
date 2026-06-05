import { AIPredictionBadge } from "@/components/ai/AIPredictionBadge";
import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentDashboardData } from "@/features/dashboard/queries";

export default async function StudentDashboardPage() {
  const dashboard = await getStudentDashboardData();

  return (
    <PageWrapper title="Student Portal" description="Academic progress, assignments, attendance, and AI-guided support.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Average" value={`${dashboard.average}%`} change="Published grade average" tone="green" />
        <KPICard label="Attendance" value={`${dashboard.attendanceRate}%`} change="Recorded attendance rate" tone="blue" />
        <KPICard label="Assignments" value={String(dashboard.assignmentCount)} change="Assigned to your class" tone="amber" />
        <KPICard label="Invoices" value={String(dashboard.openInvoices)} change={`${dashboard.reportCount} saved report${dashboard.reportCount === 1 ? "" : "s"}`} tone="red" />
      </section>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
        <span className="text-sm text-[var(--portal-muted)]">AI learning status</span>
        <AIPredictionBadge level="green" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Grade Mix</CardTitle></CardHeader><CardContent><GradeDistributionChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
