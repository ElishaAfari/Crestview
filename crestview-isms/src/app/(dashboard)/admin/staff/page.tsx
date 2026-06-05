import { StaffForm } from "@/components/forms/StaffForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StaffTable } from "@/components/tables/StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStaff } from "@/features/dashboard/queries";

export default async function AdminStaffPage() {
  const staff = await listStaff();
  return (
    <PageWrapper title="Staff" description="Manage teacher and operational staff profiles.">
      <Card><CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader><CardContent><StaffTable data={staff} /></CardContent></Card>
      <Card id="add-staff"><CardHeader><CardTitle>Add Staff</CardTitle></CardHeader><CardContent><StaffForm /></CardContent></Card>
    </PageWrapper>
  );
}
