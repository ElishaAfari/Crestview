import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GradeTable } from "@/components/tables/GradeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentGradesPage() {
  return (
    <PageWrapper title="My Grades" description="Published scores and academic progress.">
      <Card><CardHeader><CardTitle>Progress</CardTitle></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Published Grades</CardTitle></CardHeader><CardContent><GradeTable /></CardContent></Card>
    </PageWrapper>
  );
}
