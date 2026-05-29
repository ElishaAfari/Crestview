import { GradeForm } from "@/components/forms/GradeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherGradesPage() {
  return (
    <PageWrapper title="Gradebook" description="Enter and publish class assessment results.">
      <Card><CardHeader><CardTitle>Current Grades</CardTitle></CardHeader><CardContent><GradeTable /></CardContent></Card>
      <Card><CardHeader><CardTitle>Enter Grade</CardTitle></CardHeader><CardContent><GradeForm /></CardContent></Card>
    </PageWrapper>
  );
}
