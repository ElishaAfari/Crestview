import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceQrScanForm } from "@/components/forms/AttendanceQrScanForm";
import { BulkAttendanceForm } from "@/components/forms/BulkAttendanceForm";
import { AttendanceRegisterTable } from "@/components/tables/AttendanceRegisterTable";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttendanceRecords, listAttendanceRegisters, listTeacherAttendanceRoster } from "@/features/dashboard/queries";

export default async function TeacherAttendancePage() {
  const [records, registers, roster] = await Promise.all([listAttendanceRecords(), listAttendanceRegisters(), listTeacherAttendanceRoster()]);
  return (
    <PageWrapper title="Take Attendance" description="Scan student ID cards or submit the full daily class register.">
      <Card id="qr-attendance">
        <CardHeader>
          <CardTitle>QR Attendance Capture</CardTitle>
          <p className="text-sm font-bold text-[var(--portal-muted)]">Scan a student ID card first for fast entry, then use the register below for review or fallback.</p>
        </CardHeader>
        <CardContent><AttendanceQrScanForm roster={roster} /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Class Attendance Register</CardTitle></CardHeader><CardContent><BulkAttendanceForm courses={roster} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Register Submissions</CardTitle></CardHeader><CardContent><AttendanceRegisterTable data={registers} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><AttendanceTable data={records} /></CardContent></Card>
    </PageWrapper>
  );
}
