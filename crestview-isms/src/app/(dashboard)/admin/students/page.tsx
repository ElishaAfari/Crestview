import { ClassPromotionForm } from "@/components/forms/ClassPromotionForm";
import { StudentForm } from "@/components/forms/StudentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CsvDownloadLink } from "@/components/shared/CsvDownloadLink";
import { StudentIdCardGrid } from "@/components/students/StudentIdCardGrid";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminFormOptions, listStudentIdCards } from "@/features/admin/queries";
import { listStudents } from "@/features/dashboard/queries";

export default async function AdminStudentsPage() {
  const [students, options, idCards] = await Promise.all([listStudents(), listAdminFormOptions(), listStudentIdCards()]);
  return (
    <PageWrapper title="Students" description="Manage enrollment, class placement, attendance context, and guardian links.">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Student Directory</CardTitle>
          <CsvDownloadLink rows={students} filename="crestview-student-directory.csv" label="Download records" />
        </CardHeader>
        <CardContent><StudentTable data={students} showControls /></CardContent>
      </Card>
      <Card id="student-id-cards">
        <CardHeader>
          <CardTitle>Student QR ID Cards</CardTitle>
          <p className="text-sm font-bold text-[var(--portal-muted)]">Print or verify student cards used for daily fee and attendance scans.</p>
        </CardHeader>
        <CardContent><StudentIdCardGrid cards={idCards} /></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Class Promotion</CardTitle></CardHeader><CardContent><ClassPromotionForm classrooms={options.classrooms} /></CardContent></Card>
      <Card id="add-student"><CardHeader><CardTitle>Add Student</CardTitle></CardHeader><CardContent><StudentForm classrooms={options.classrooms} /></CardContent></Card>
    </PageWrapper>
  );
}
