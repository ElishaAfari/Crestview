import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { getReportDetail } from "@/features/reports/queries";

export default async function ParentReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReportDetail(reportId);
  if (!report) notFound();

  return (
    <PageWrapper title="Child Academic Report" description="Guardian view of the published report, progress analysis, attendance, and teacher guidance.">
      <ReportDetailView report={report} backHref="/parent/children" />
    </PageWrapper>
  );
}
