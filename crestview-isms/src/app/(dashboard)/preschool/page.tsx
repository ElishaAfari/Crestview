import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function PreschoolPage() {
  return <PageWrapper title="Preschool" description="Daily child-care logs, observations, pickups, incidents, portfolios, and parent report readiness."><RemainingSuiteOverview workspaceKey="preschool" /></PageWrapper>;
}
