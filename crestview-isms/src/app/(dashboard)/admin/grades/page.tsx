import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { GradeForm } from "@/components/forms/GradeForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminGradesPage() {
  return (
    <PageWrapper title="Grades" description="Enter, publish, and review assessment performance.">
      <Card><CardHeader><CardTitle>Distribution</CardTitle></CardHeader><CardContent><GradeDistributionChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Gradebook</CardTitle></CardHeader><CardContent><GradeTable /></CardContent></Card>
      <Card><CardHeader><CardTitle>Enter Grade</CardTitle></CardHeader><CardContent><GradeForm /></CardContent></Card>
    </PageWrapper>
  );
}
