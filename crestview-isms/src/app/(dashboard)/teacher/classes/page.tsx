import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherClassesPage() {
  return (
    <PageWrapper title="Classes" description="Current teaching groups and class-level signals.">
      <Card><CardHeader><CardTitle>Grade 7A</CardTitle></CardHeader><CardContent><StudentTable /></CardContent></Card>
      <Card><CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
    </PageWrapper>
  );
}
