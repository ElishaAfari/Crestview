import { PageWrapper } from "@/components/layout/PageWrapper";
import { AssignmentTable } from "@/components/tables/AssignmentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAssignmentsForCurrentRole } from "@/features/dashboard/queries";

export default async function StudentAssignmentsPage() {
  const assignments = await listAssignmentsForCurrentRole();

  return (
    <PageWrapper title="Assignments" description="Upcoming, submitted, and graded assignments.">
      <Card><CardHeader><CardTitle>Due Soon</CardTitle></CardHeader><CardContent><AssignmentTable data={assignments} /></CardContent></Card>
    </PageWrapper>
  );
}
