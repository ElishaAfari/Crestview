import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudents } from "@/features/dashboard/queries";

export default async function TeacherClassesPage() {
  const students = await listStudents();
  return (
    <PageWrapper title="Classes" description="Current teaching groups and class-level signals.">
      <Card><CardHeader><CardTitle>Student directory</CardTitle></CardHeader><CardContent><StudentTable data={students} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
    </PageWrapper>
  );
}
