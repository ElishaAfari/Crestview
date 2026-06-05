import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceForm } from "@/components/forms/AttendanceForm";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords, listTeacherFormOptions } from "@/features/dashboard/queries";

export default async function TeacherAttendancePage() {
  const [records, options] = await Promise.all([listAttendanceRecords(), listTeacherFormOptions()]);
  return (
    <PageWrapper title="Take Attendance" description="Record daily class attendance.">
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Record Attendance</CardTitle></CardHeader><CardContent><AttendanceForm classrooms={options.classrooms} courses={options.courses} students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
