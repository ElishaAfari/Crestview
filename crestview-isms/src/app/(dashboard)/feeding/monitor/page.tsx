import { FeedingOverview } from "@/components/finance/FeedingOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FeedingMonitorPage() {
  return <PageWrapper title="Daily Feeding Monitor" description="Review expected learners, collection activity, and service exceptions for the day."><FeedingOverview /></PageWrapper>;
}
