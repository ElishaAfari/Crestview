import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function ExamsPage() {
  return <PageWrapper title="Examinations" description="Manage exam windows, course sessions, grading items, publication, and timetable readiness."><RemainingSuiteOverview workspaceKey="exams" /></PageWrapper>;
}
