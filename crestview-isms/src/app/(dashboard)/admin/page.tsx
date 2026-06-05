import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { EnrollmentChart } from "@/components/charts/EnrollmentChart";
import { FinanceChart } from "@/components/charts/FinanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getAdminDashboardData } from "@/features/admin/queries";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <PageWrapper title="Operations Dashboard" description="Live school operations, enrollment, attendance, finance, and academic health.">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard label="Students" value={dashboard.metrics.students.toLocaleString("en-GH")} change="Active enrollment records" tone="blue" />
        <KPICard label="Staff" value={dashboard.metrics.staff.toLocaleString("en-GH")} change="Active staff accounts" tone="blue" />
        <KPICard label="Attendance" value={`${dashboard.metrics.attendanceRate}%`} change="Recorded today" tone="green" />
        <KPICard label="Open invoices" value={dashboard.metrics.openInvoices.toLocaleString("en-GH")} change={`${dashboard.metrics.collectionRate}% collection rate`} tone="amber" />
        <KPICard label="Admissions" value={dashboard.metrics.openAdmissions.toLocaleString("en-GH")} change="Awaiting review" tone="red" />
      </section>
      <QuickActions />
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
        <CalendarWidget items={dashboard.events} />
        <Card><CardHeader><CardTitle>Enrollment</CardTitle></CardHeader><CardContent><EnrollmentChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee Collection</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
        <ActivityFeed items={dashboard.activity} />
      </section>
    </PageWrapper>
  );
}
