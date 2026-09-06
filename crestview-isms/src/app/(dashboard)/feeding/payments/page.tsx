import { FeedingPaymentsWorkspace } from "@/components/finance/FeedingPaymentsWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FeedingPaymentsPage() {
  return <PageWrapper title="Feeding Payments" description="Record and search daily feeding collections."><FeedingPaymentsWorkspace /></PageWrapper>;
}
