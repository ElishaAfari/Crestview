import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listParentStudents } from "@/features/dashboard/queries";

export default async function ParentChildrenPage() {
  const students = await listParentStudents();
  return (
    <PageWrapper title="Children" description="Linked student profiles and academic status.">
      <Card><CardHeader><CardTitle>Linked Students</CardTitle></CardHeader><CardContent><StudentTable data={students} /></CardContent></Card>
    </PageWrapper>
  );
}
