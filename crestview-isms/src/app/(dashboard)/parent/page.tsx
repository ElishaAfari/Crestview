import { ParentDashboardView } from "@/components/dashboard/ParentDashboardView";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getParentDashboardData } from "@/features/dashboard/queries";

export default async function ParentDashboardPage() {
  const dashboard = await getParentDashboardData();

  return (
    <PageWrapper title="Parent Portal" description="Children, fees, messages, and academic progress in one place.">
      <ParentDashboardView dashboard={dashboard} />
    </PageWrapper>
  );
}
