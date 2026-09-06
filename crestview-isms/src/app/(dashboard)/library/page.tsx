import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function LibraryPage() {
  return <PageWrapper title="Library" description="Manage the catalogue, physical copies, circulation, returns, and fine registers."><RemainingSuiteOverview workspaceKey="library" /></PageWrapper>;
}
