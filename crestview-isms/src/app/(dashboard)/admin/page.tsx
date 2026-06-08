import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getAdminDashboardData } from "@/features/admin/queries";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <PageWrapper title="Operations Dashboard" description="Live school operations, enrollment, attendance, finance, admissions, recruitment, and role-based suites.">
      <AdminDashboardView dashboard={dashboard} />
    </PageWrapper>
  );
}
