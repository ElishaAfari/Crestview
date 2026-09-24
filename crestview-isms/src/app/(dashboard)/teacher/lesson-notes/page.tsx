import { LessonNotesWorkspace } from "@/components/lesson-notes/LessonNotesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getLessonNotesWorkspace } from "@/features/lesson-notes/queries";

export default async function TeacherLessonNotesPage() {
  const workspace = await getLessonNotesWorkspace();
  return (
    <PageWrapper title="Schemes and Lesson Notes" description="Write notes for assigned classes, submit them for vetting, and act on reviewer feedback.">
      <LessonNotesWorkspace {...workspace} />
    </PageWrapper>
  );
}
