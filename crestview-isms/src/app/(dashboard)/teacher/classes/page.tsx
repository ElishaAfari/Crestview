import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { ClassRosterManager } from "@/components/forms/ClassRosterManager";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudents, listTeacherClassRosters } from "@/features/dashboard/queries";

export default async function TeacherClassesPage() {
  const [students, rosters] = await Promise.all([listStudents(), listTeacherClassRosters()]);
  return (
    <PageWrapper title="Classes" description="Manage assigned class rosters for the academic year and monitor class-level signals.">
      <Card><CardHeader><CardTitle>Class Roster Setup</CardTitle></CardHeader><CardContent><ClassRosterManager rosters={rosters} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Student directory</CardTitle></CardHeader><CardContent><StudentTable data={students} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
    </PageWrapper>
  );
}
