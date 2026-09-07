import { FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportTable } from "@/components/tables/ReportTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCurrentStudentReports } from "@/features/dashboard/queries";

export default async function StudentReportsPage() {
  const reports = await listCurrentStudentReports();

  return (
    <PageWrapper
      title="My Reports"
      description="Published end-of-term reports, positions, attendance summaries, and teacher comments."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-[#174ea6]" aria-hidden />
            Term Reports
          </CardTitle>
          <p className="text-sm font-semibold text-[var(--portal-muted)]">
            Open any published report to review subject scores, grading
            analysis, strengths, and next steps.
          </p>
        </CardHeader>
        <CardContent>
          <ReportTable data={reports} viewBasePath="/student/reports" />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
