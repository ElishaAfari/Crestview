import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { GradeForm } from "@/components/forms/GradeForm";
import { GradeImportForm } from "@/components/forms/GradeImportForm";
import { GradeItemForm } from "@/components/forms/GradeItemForm";
import { GradingScaleManager } from "@/components/forms/GradingScaleManager";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions, listGradingScalesForAdmin } from "@/features/admin/queries";
import { listGrades } from "@/features/dashboard/queries";

export default async function AdminGradesPage() {
  const [grades, options, scales] = await Promise.all([listGrades(), listAdminFormOptions(), listGradingScalesForAdmin()]);
  return (
    <PageWrapper title="Grades" description="Enter, publish, and review assessment performance.">
      <Card><CardHeader><CardTitle>Distribution</CardTitle></CardHeader><CardContent><GradeDistributionChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Create Subject Assessment</CardTitle></CardHeader><CardContent><GradeItemForm courses={options.courses} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Gradebook</CardTitle></CardHeader><CardContent><GradeTable data={grades} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Subject Grade Import</CardTitle></CardHeader><CardContent><GradeImportForm contexts={options.gradeImportContexts} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Editable Grading Scale</CardTitle></CardHeader><CardContent><GradingScaleManager scales={scales} /></CardContent></Card>
      <Card id="enter-grade"><CardHeader><CardTitle>Enter Grade</CardTitle></CardHeader><CardContent><GradeForm gradeItems={options.gradeItems} students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
