import { SchemesOfWorkWorkspace } from "@/components/lesson-notes/SchemesOfWorkWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getSchemesOfWorkWorkspace } from "@/features/lesson-notes/queries";

export default async function AcademicSchemesPage() {
  const workspace = await getSchemesOfWorkWorkspace();
  return <PageWrapper title="Schemes of Work" description="Manage course-bound weekly schemes and make them available for connected teacher lesson notes."><SchemesOfWorkWorkspace {...workspace} /></PageWrapper>;
}
