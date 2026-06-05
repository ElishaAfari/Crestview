import { FinanceChart } from "@/components/charts/FinanceChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getParentDashboardData } from "@/features/dashboard/queries";

export default async function ParentDashboardPage() {
  const dashboard = await getParentDashboardData();

  return (
    <PageWrapper title="Parent Portal" description="Children, fees, messages, and academic progress in one place.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Children" value={String(dashboard.children)} change="Linked active students" tone="blue" />
        <KPICard label="Attendance" value={`${dashboard.attendanceRate}%`} change="Family attendance rate" tone="green" />
        <KPICard label="Invoices" value={String(dashboard.openInvoices)} change="Open family invoices" tone="amber" />
        <KPICard label="Messages" value={String(dashboard.unreadNotifications)} change="Unread notifications" tone="red" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Academic Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee Status</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
