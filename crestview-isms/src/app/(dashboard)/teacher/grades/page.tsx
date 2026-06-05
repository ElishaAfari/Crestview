import { GradeForm } from "@/components/forms/GradeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listGrades, listTeacherFormOptions } from "@/features/dashboard/queries";

export default async function TeacherGradesPage() {
  const [grades, options] = await Promise.all([listGrades(), listTeacherFormOptions()]);
  return (
    <PageWrapper title="Gradebook" description="Enter and publish class assessment results.">
      <Card><CardHeader><CardTitle>Current Grades</CardTitle></CardHeader><CardContent><GradeTable data={grades} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Enter Grade</CardTitle></CardHeader><CardContent><GradeForm gradeItems={options.gradeItems} students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
