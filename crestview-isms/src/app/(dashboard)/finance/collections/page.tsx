import { FinanceFeesWorkspace } from "@/components/finance/FinanceFeesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceCollectionsPage() {
  return (
    <PageWrapper title="Collections" description="Monitor daily payments, special invoices, and finance collection activity from one register.">
      <FinanceFeesWorkspace focus="collections" />
    </PageWrapper>
  );
}
