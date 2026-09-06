import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function ItPage() {
  return <PageWrapper title="IT Support" description="Track devices, support tickets, integrations, and platform audit activity."><RemainingSuiteOverview workspaceKey="it" /></PageWrapper>;
}
