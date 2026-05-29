import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentTable } from "@/components/tables/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentChildrenPage() {
  return (
    <PageWrapper title="Children" description="Linked student profiles and academic status.">
      <Card><CardHeader><CardTitle>Linked Students</CardTitle></CardHeader><CardContent><StudentTable /></CardContent></Card>
    </PageWrapper>
  );
}
