import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <PageWrapper title="Teacher Workspace" description="Classroom tasks, attendance, grading, and lesson planning.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Classes" value="4" change="3 today" tone="blue" />
        <KPICard label="Assignments" value="12" change="5 need marking" tone="amber" />
        <KPICard label="Attendance" value="96%" change="Grade 7A complete" tone="green" />
        <KPICard label="Insights" value="3" change="New AI suggestions" tone="red" />
      </section>
      <AIInsightCard insight="Grade 7A is improving in mathematics, but three students show a pattern of missed homework before assessment weeks." />
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Performance</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
