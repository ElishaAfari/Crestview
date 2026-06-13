import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { ReportTable } from "@/components/tables/ReportTable";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listParentGrades, listParentReports, listParentStudents } from "@/features/dashboard/queries";

export default async function ParentChildrenPage() {
  const [students, grades, reports] = await Promise.all([listParentStudents(), listParentGrades(), listParentReports()]);
  return (
    <PageWrapper title="Children" description="Linked student profiles and academic status.">
      <Card><CardHeader><CardTitle>Linked Students</CardTitle></CardHeader><CardContent><StudentTable data={students} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Published Grades</CardTitle></CardHeader><CardContent><GradeTable data={grades} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Term Reports</CardTitle></CardHeader><CardContent><ReportTable data={reports} viewBasePath="/parent/reports" /></CardContent></Card>
    </PageWrapper>
  );
}
