import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { getReportDetail } from "@/features/reports/queries";

export default async function StudentReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReportDetail(reportId);
  if (!report) notFound();

  return (
    <PageWrapper title="My Academic Report" description="Your published report with subject results, attendance, strengths, and next steps.">
      <ReportDetailView report={report} backHref="/student/grades" />
    </PageWrapper>
  );
}
