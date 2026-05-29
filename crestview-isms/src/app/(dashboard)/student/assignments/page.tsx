import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentAssignmentsPage() {
  return (
    <PageWrapper title="Assignments" description="Upcoming, submitted, and graded assignments.">
      <Card><CardHeader><CardTitle>Due Soon</CardTitle></CardHeader><CardContent className="text-sm text-slate-400">Mathematics term project is due in 14 days.</CardContent></Card>
    </PageWrapper>
  );
}
