import { StudentForm } from "@/components/forms/StudentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStudentsPage() {
  return (
    <PageWrapper title="Students" description="Manage enrollment, class placement, attendance context, and guardian links.">
      <Card><CardHeader><CardTitle>Student Directory</CardTitle></CardHeader><CardContent><StudentTable /></CardContent></Card>
      <Card><CardHeader><CardTitle>Add Student</CardTitle></CardHeader><CardContent><StudentForm /></CardContent></Card>
    </PageWrapper>
  );
}
