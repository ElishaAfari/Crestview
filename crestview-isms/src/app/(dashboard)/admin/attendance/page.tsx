import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAttendancePage() {
  return (
    <PageWrapper title="Attendance" description="Track daily and course-level attendance.">
      <Card><CardHeader><CardTitle>Weekly Attendance</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Today</CardTitle></CardHeader><CardContent><AttendanceTable /></CardContent></Card>
    </PageWrapper>
  );
}
