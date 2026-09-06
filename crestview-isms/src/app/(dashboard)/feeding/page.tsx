import { FeedingOverview } from "@/components/finance/FeedingOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FeedingPage() {
  return <PageWrapper title="Feeding Fees" description="Daily feeding enrollment, collections, arrears, exemptions, and remittance tracking."><FeedingOverview /></PageWrapper>;
}
