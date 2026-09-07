import { FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportTable } from "@/components/tables/ReportTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listParentReports } from "@/features/dashboard/queries";

export default async function ParentReportsPage() {
  const reports = await listParentReports();

  return (
    <PageWrapper
      title="Children's Reports"
      description="Published academic reports for the learners linked to this parent account."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-[#174ea6]" aria-hidden />
            Published Reports
          </CardTitle>
          <p className="text-sm font-semibold text-[var(--portal-muted)]">
            Parents only see reports for children connected to their account.
          </p>
        </CardHeader>
        <CardContent>
          <ReportTable data={reports} viewBasePath="/parent/reports" />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
