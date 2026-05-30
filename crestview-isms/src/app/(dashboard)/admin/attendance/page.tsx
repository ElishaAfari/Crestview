import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords } from "@/features/dashboard/queries";

export default async function AdminAttendancePage() {
  const records = await listAttendanceRecords();
  return (
    <PageWrapper title="Attendance" description="Track daily and course-level attendance.">
      <Card><CardHeader><CardTitle>Weekly Attendance</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
    </PageWrapper>
  );
}
