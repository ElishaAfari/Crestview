import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords } from "@/features/dashboard/queries";

export default async function StudentAttendancePage() {
  const records = await listAttendanceRecords();
  return (
    <PageWrapper title="My Attendance" description="Daily attendance and punctuality patterns.">
      <Card><CardHeader><CardTitle>Trend</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
    </PageWrapper>
  );
}
