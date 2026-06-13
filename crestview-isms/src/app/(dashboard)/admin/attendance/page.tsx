import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { AttendanceForm } from "@/components/forms/AttendanceForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceRegisterTable } from "@/components/tables/AttendanceRegisterTable";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions } from "@/features/admin/queries";
import { listAttendanceRecords, listAttendanceRegisters } from "@/features/dashboard/queries";

export default async function AdminAttendancePage() {
  const [records, registers, options] = await Promise.all([listAttendanceRecords(), listAttendanceRegisters(), listAdminFormOptions()]);
  return (
    <PageWrapper title="Attendance" description="Track daily and course-level attendance.">
      <Card><CardHeader><CardTitle>Weekly Attendance</CardTitle></CardHeader><CardContent><AttendanceChart /></CardContent></Card>
      <Card><CardHeader><CardTitle>Submitted Registers</CardTitle></CardHeader><CardContent><AttendanceRegisterTable data={registers} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
      <Card id="record-attendance"><CardHeader><CardTitle>Record Attendance</CardTitle></CardHeader><CardContent><AttendanceForm classrooms={options.classrooms} courses={options.courses} students={options.students} /></CardContent></Card>
    </PageWrapper>
  );
}
