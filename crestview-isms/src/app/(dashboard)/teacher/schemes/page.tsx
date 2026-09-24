import { SchemesOfWorkWorkspace } from "@/components/lesson-notes/SchemesOfWorkWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getSchemesOfWorkWorkspace } from "@/features/lesson-notes/queries";

export default async function TeacherSchemesPage() {
  const workspace = await getSchemesOfWorkWorkspace();
  return <PageWrapper title="Schemes of Work" description="Plan weekly topics, objectives, and resources for your assigned class and subject."><SchemesOfWorkWorkspace {...workspace} /></PageWrapper>;
}
