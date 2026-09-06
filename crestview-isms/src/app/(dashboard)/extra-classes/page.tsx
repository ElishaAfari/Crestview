import { ExtraClassesOverview } from "@/components/finance/ExtraClassesOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function ExtraClassesPage() {
  return <PageWrapper title="Extra Classes" description="Daily extra-class enrollment, collections, arrears, exemptions, and reconciliation."><ExtraClassesOverview /></PageWrapper>;
}
