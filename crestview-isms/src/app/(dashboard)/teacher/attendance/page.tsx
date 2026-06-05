import { PageWrapper } from "@/components/layout/PageWrapper";
import { BulkAttendanceForm } from "@/components/forms/BulkAttendanceForm";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords, listTeacherAttendanceRoster } from "@/features/dashboard/queries";

export default async function TeacherAttendancePage() {
  const [records, roster] = await Promise.all([listAttendanceRecords(), listTeacherAttendanceRoster()]);
  return (
    <PageWrapper title="Take Attendance" description="Record daily class attendance.">
      <Card><CardHeader><CardTitle>Class Attendance Register</CardTitle></CardHeader><CardContent><BulkAttendanceForm courses={roster} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
    </PageWrapper>
  );
}
