import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { getReportDetail } from "@/features/reports/queries";

export default async function TeacherReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReportDetail(reportId);
  if (!report) notFound();

  return (
    <PageWrapper title="Learner Report Review" description="Teacher-scoped published report details for assigned learners.">
      <ReportDetailView report={report} backHref="/teacher/student-360" />
    </PageWrapper>
  );
}
