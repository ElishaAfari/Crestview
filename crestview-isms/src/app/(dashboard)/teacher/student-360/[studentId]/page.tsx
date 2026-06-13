import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Student360DetailView } from "@/components/student-360/Student360DetailView";
import { getStudent360Detail } from "@/features/automation/queries";

export default async function TeacherStudent360DetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const detail = await getStudent360Detail(studentId);
  if (!detail) notFound();

  return (
    <PageWrapper title="Assigned Learner Profile" description="Teacher-scoped learner support view for academic progress, attendance, reports, intervention notes, and follow-up tasks.">
      <Student360DetailView detail={detail} backHref="/teacher/student-360" reportBasePath="/teacher/reports" />
    </PageWrapper>
  );
}
