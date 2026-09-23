import { StaffForm } from "@/components/forms/StaffForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CsvDownloadLink } from "@/components/shared/CsvDownloadLink";
import { StaffIdCardGrid } from "@/components/staff/StaffIdCardGrid";
import { StaffTable } from "@/components/tables/StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStaff } from "@/features/dashboard/queries";
import { listStaffIdCards } from "@/features/admin/queries";

export default async function AdminStaffPage() {
  const [staff, idCards] = await Promise.all([listStaff(), listStaffIdCards()]);
  return (
    <PageWrapper title="Staff" description="Manage teacher and operational staff profiles.">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Staff Directory</CardTitle>
          <CsvDownloadLink rows={staff} filename="crestview-staff-directory.csv" label="Download records" />
        </CardHeader>
        <CardContent><StaffTable data={staff} /></CardContent>
      </Card>
      <Card id="add-staff"><CardHeader><CardTitle>Add Staff</CardTitle></CardHeader><CardContent><StaffForm /></CardContent></Card>
      <Card id="staff-id-cards"><CardHeader><CardTitle>Staff ID Cards</CardTitle></CardHeader><CardContent><StaffIdCardGrid cards={idCards} /></CardContent></Card>
    </PageWrapper>
  );
}
