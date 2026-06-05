import { StudentForm } from "@/components/forms/StudentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions } from "@/features/admin/queries";
import { listStudents } from "@/features/dashboard/queries";

export default async function AdminStudentsPage() {
  const [students, options] = await Promise.all([listStudents(), listAdminFormOptions()]);
  return (
    <PageWrapper title="Students" description="Manage enrollment, class placement, attendance context, and guardian links.">
      <Card><CardHeader><CardTitle>Student Directory</CardTitle></CardHeader><CardContent><StudentTable data={students} /></CardContent></Card>
      <Card id="add-student"><CardHeader><CardTitle>Add Student</CardTitle></CardHeader><CardContent><StudentForm classrooms={options.classrooms} /></CardContent></Card>
    </PageWrapper>
  );
}
