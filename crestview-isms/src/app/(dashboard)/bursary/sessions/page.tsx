import { BursarySessionsWorkspace } from "@/components/finance/BursarySessionsWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function BursarySessionsPage() {
  return <PageWrapper title="Cashier Sessions" description="All shifts across the bursary."><BursarySessionsWorkspace /></PageWrapper>;
}
