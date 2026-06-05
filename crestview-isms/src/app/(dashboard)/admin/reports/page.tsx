import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { ReportForm } from "@/components/forms/ReportForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ReportTable } from "@/components/tables/ReportTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions, listReportsForAdmin } from "@/features/admin/queries";

export default async function AdminReportsPage() {
  const [options, reports] = await Promise.all([listAdminFormOptions(), listReportsForAdmin()]);

  return (
    <PageWrapper title="Reports" description="Generate academic, attendance, finance, and AI-supported student reports.">
      <AIInsightCard insight="Report generation combines computed grades, attendance, and AI narrative summaries for review before publishing." />
      <Card id="generate-report"><CardHeader><CardTitle>Generate Report</CardTitle></CardHeader><CardContent><ReportForm academicYears={options.academicYears} students={options.students} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Saved Reports</CardTitle></CardHeader><CardContent><ReportTable data={reports} /></CardContent></Card>
    </PageWrapper>
  );
}
