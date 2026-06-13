import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Student360DetailView } from "@/components/student-360/Student360DetailView";
import { getStudent360Detail } from "@/features/automation/queries";

export default async function AdminStudent360DetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const detail = await getStudent360Detail(studentId);
  if (!detail) notFound();

  return (
    <PageWrapper title="Learner Profile" description="A complete, connected learner record for support, finance, academic reporting, and follow-up decisions.">
      <Student360DetailView detail={detail} backHref="/admin/student-360" reportBasePath="/admin/reports" canManageFinance />
    </PageWrapper>
  );
}
