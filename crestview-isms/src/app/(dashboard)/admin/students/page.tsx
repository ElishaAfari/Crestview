import { ClassPromotionForm } from "@/components/forms/ClassPromotionForm";
import { StudentForm } from "@/components/forms/StudentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CsvDownloadLink } from "@/components/shared/CsvDownloadLink";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions } from "@/features/admin/queries";
import { listStudents } from "@/features/dashboard/queries";

export default async function AdminStudentsPage() {
  const [students, options] = await Promise.all([listStudents(), listAdminFormOptions()]);
  return (
    <PageWrapper title="Students" description="Manage enrollment, class placement, attendance context, and guardian links.">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Student Directory</CardTitle>
          <CsvDownloadLink rows={students} filename="crestview-student-directory.csv" label="Download records" />
        </CardHeader>
        <CardContent><StudentTable data={students} showControls /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Class Promotion</CardTitle></CardHeader><CardContent><ClassPromotionForm classrooms={options.classrooms} /></CardContent></Card>
      <Card id="add-student"><CardHeader><CardTitle>Add Student</CardTitle></CardHeader><CardContent><StudentForm classrooms={options.classrooms} /></CardContent></Card>
    </PageWrapper>
  );
}
