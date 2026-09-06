import { PageWrapper } from "@/components/layout/PageWrapper";
import { AttendanceQrScanForm } from "@/components/forms/AttendanceQrScanForm";
import { BulkAttendanceForm } from "@/components/forms/BulkAttendanceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminAttendanceMarkRoster } from "@/features/dashboard/queries";

export default async function AdminAttendanceMarkPage() {
  const roster = await listAdminAttendanceMarkRoster();
  return (
    <PageWrapper title="Mark Attendance" description="Record daily student attendance by class and date.">
      <Card id="qr-attendance">
        <CardHeader><CardTitle>QR attendance capture</CardTitle><p className="text-sm font-bold text-[var(--portal-muted)]">Scan a student ID card for quick entry, then review the full register below before closing the day.</p></CardHeader>
        <CardContent><AttendanceQrScanForm roster={roster} /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Daily class register</CardTitle><p className="text-sm font-bold text-[var(--portal-muted)]">Search the class list, mark each learner as present, late, absent, or excused, and submit once for the selected date.</p></CardHeader><CardContent><BulkAttendanceForm courses={roster} /></CardContent></Card>
    </PageWrapper>
  );
}
