import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherAssignmentsPage() {
  return (
    <PageWrapper title="Assignments" description="Create assignments and review submissions.">
      <Card><CardHeader><CardTitle>Create Assignment</CardTitle></CardHeader><CardContent><AssignmentForm /></CardContent></Card>
    </PageWrapper>
  );
}
