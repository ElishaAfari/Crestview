import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function AcademicsOfficePage() {
  return <PageWrapper title="Academic Planning" description="Coordinate schemes of work, curriculum units, lesson plans, study materials, timetables, and teaching readiness."><RemainingSuiteOverview workspaceKey="academics-office" /></PageWrapper>;
}
