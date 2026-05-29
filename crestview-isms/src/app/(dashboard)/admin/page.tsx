import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { EnrollmentChart } from "@/components/charts/EnrollmentChart";
import { FinanceChart } from "@/components/charts/FinanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function AdminDashboardPage() {
  return (
    <PageWrapper title="Operations Dashboard" description="Live school operations, enrollment, attendance, finance, and academic health.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Students" value="1,180" change="+12% this year" tone="blue" />
        <KPICard label="Attendance" value="95%" change="+3% this week" tone="green" />
        <KPICard label="Open invoices" value="$28k" change="18 due soon" tone="amber" />
        <KPICard label="AI alerts" value="7" change="2 high priority" tone="red" />
      </section>
      <QuickActions />
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
        <CalendarWidget />
        <Card><CardHeader><CardTitle>Enrollment</CardTitle></CardHeader><CardContent><EnrollmentChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee Collection</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
        <ActivityFeed />
      </section>
    </PageWrapper>
  );
}
