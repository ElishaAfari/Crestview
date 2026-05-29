import { AIPredictionBadge } from "@/components/ai/AIPredictionBadge";
import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <PageWrapper title="Student Portal" description="Academic progress, assignments, attendance, and AI-guided support.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Average" value="86%" change="+4% this term" tone="green" />
        <KPICard label="Attendance" value="94%" change="2 late marks" tone="blue" />
        <KPICard label="Assignments" value="5" change="2 due this week" tone="amber" />
        <KPICard label="Risk" value="Low" change="On track" tone="green" />
      </section>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-5">
        <span className="text-sm text-slate-400">AI learning status</span>
        <AIPredictionBadge level="green" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Grade Mix</CardTitle></CardHeader><CardContent><GradeDistributionChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
