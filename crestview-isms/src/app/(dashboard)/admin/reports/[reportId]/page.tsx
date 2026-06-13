import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportDetailView } from "@/components/reports/ReportDetailView";
import { getReportDetail } from "@/features/reports/queries";

export default async function AdminReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReportDetail(reportId);
  if (!report) notFound();

  return (
    <PageWrapper title="Academic Report Review" description="Published report analysis with grades, attendance, teacher summary, strengths, concerns, and next steps.">
      <ReportDetailView report={report} backHref="/admin/reports" />
    </PageWrapper>
  );
}
