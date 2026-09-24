import { LessonNotesWorkspace } from "@/components/lesson-notes/LessonNotesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getLessonNotesWorkspace } from "@/features/lesson-notes/queries";

export default async function AcademicLessonNotesPage() {
  const workspace = await getLessonNotesWorkspace();
  return (
    <PageWrapper title="Lesson Note Vetting" description="Review teacher lesson notes against their course and scheme of work, then approve or return them with feedback.">
      <LessonNotesWorkspace {...workspace} />
    </PageWrapper>
  );
}
