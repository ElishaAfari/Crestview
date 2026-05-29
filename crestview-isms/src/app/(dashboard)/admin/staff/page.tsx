import { StaffForm } from "@/components/forms/StaffForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StaffTable } from "@/components/tables/StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStaffPage() {
  return (
    <PageWrapper title="Staff" description="Manage teacher and operational staff profiles.">
      <Card><CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader><CardContent><StaffTable /></CardContent></Card>
      <Card><CardHeader><CardTitle>Add Staff</CardTitle></CardHeader><CardContent><StaffForm /></CardContent></Card>
    </PageWrapper>
  );
}
