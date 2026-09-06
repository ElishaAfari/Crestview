import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function FrontOfficePage() {
  return <PageWrapper title="Front Office" description="Reception, walk-in enquiries, visitors, parent complaints, admissions touchpoints, and event desk activity."><RemainingSuiteOverview workspaceKey="front-office" /></PageWrapper>;
}
