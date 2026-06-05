import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AssignmentTable } from "@/components/tables/AssignmentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAssignmentsForCurrentRole, listTeacherFormOptions } from "@/features/dashboard/queries";

export default async function TeacherAssignmentsPage() {
  const [assignments, options] = await Promise.all([listAssignmentsForCurrentRole(), listTeacherFormOptions()]);

  return (
    <PageWrapper title="Assignments" description="Create assignments and review submissions.">
      <Card><CardHeader><CardTitle>Assignments</CardTitle></CardHeader><CardContent><AssignmentTable data={assignments} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Create Assignment</CardTitle></CardHeader><CardContent><AssignmentForm courses={options.courses} /></CardContent></Card>
    </PageWrapper>
  );
}
