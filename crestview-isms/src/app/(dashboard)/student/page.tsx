import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getStudentDashboardData } from "@/features/dashboard/queries";

export default async function StudentDashboardPage() {
  const dashboard = await getStudentDashboardData();

  return (
    <PageWrapper title="Student Portal" description="Academic progress, assignments, attendance, and AI-guided support.">
      <StudentDashboardView dashboard={dashboard} />
    </PageWrapper>
  );
}
