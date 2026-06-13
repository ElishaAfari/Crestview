import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { ReportTable } from "@/components/tables/ReportTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCurrentStudentGrades, listCurrentStudentReports } from "@/features/dashboard/queries";

export default async function StudentGradesPage() {
  const [grades, reports] = await Promise.all([listCurrentStudentGrades(), listCurrentStudentReports()]);
  return (
    <PageWrapper title="My Grades" description="Published scores and academic progress.">
      <Card><CardHeader><CardTitle>Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Published Grades</CardTitle></CardHeader><CardContent><GradeTable data={grades} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Term Reports</CardTitle></CardHeader><CardContent><ReportTable data={reports} viewBasePath="/student/reports" /></CardContent></Card>
    </PageWrapper>
  );
}
