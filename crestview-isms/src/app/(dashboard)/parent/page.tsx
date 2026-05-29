import { FinanceChart } from "@/components/charts/FinanceChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentDashboardPage() {
  return (
    <PageWrapper title="Parent Portal" description="Children, fees, messages, and academic progress in one place.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Children" value="3" change="All active" tone="blue" />
        <KPICard label="Attendance" value="95%" change="Family average" tone="green" />
        <KPICard label="Invoices" value="2" change="1 due soon" tone="amber" />
        <KPICard label="Messages" value="4" change="2 unread" tone="red" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Academic Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Fee Status</CardTitle></CardHeader><CardContent><FinanceChart /></CardContent></Card>
      </section>
    </PageWrapper>
  );
}
