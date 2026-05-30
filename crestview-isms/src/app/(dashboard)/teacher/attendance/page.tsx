import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords } from "@/features/dashboard/queries";

export default async function TeacherAttendancePage() {
  const records = await listAttendanceRecords();
  return (
    <PageWrapper title="Take Attendance" description="Record daily class attendance.">
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
    </PageWrapper>
  );
}
