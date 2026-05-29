import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherAttendancePage() {
  return (
    <PageWrapper title="Take Attendance" description="Record daily class attendance.">
      <Card><CardHeader><CardTitle>Today</CardTitle></CardHeader><CardContent><AttendanceTable /></CardContent></Card>
    </PageWrapper>
  );
}
