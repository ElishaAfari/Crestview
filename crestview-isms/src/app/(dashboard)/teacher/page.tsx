import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeacherDashboardData } from "@/features/dashboard/queries";

export default async function TeacherDashboardPage() {
  const dashboard = await getTeacherDashboardData();

  return (
    <PageWrapper title="Teacher Workspace" description="Classroom tasks, attendance, grading, and lesson planning.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Classes" value={String(dashboard.classes)} change={`${dashboard.courses} active course${dashboard.courses === 1 ? "" : "s"}`} tone="blue" />
        <KPICard label="Assignments" value={String(dashboard.assignments)} change="Created for your courses" tone="amber" />
        <KPICard label="Attendance" value={`${dashboard.attendanceRate}%`} change="Recorded today" tone="green" />
        <KPICard label="Grades" value={String(dashboard.gradedItems)} change="Published score records" tone="red" />
      </section>
      <AIInsightCard insight="Grade 7A is improving in mathematics, but three students show a pattern of missed homework before assessment weeks." />
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Performance</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
