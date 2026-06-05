import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { GradeForm } from "@/components/forms/GradeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions } from "@/features/admin/queries";
import { listGrades } from "@/features/dashboard/queries";

export default async function AdminGradesPage() {
  const [grades, options] = await Promise.all([listGrades(), listAdminFormOptions()]);
  return (
    <PageWrapper title="Grades" description="Enter, publish, and review assessment performance.">
      <Card><CardHeader><CardTitle>Distribution</CardTitle></CardHeader><CardContent><GradeDistributionChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Gradebook</CardTitle></CardHeader><CardContent><GradeTable data={grades} /></CardContent></Card>
      <Card id="enter-grade"><CardHeader><CardTitle>Enter Grade</CardTitle></CardHeader><CardContent><GradeForm gradeItems={options.gradeItems} students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
