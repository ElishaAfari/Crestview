import { FinanceFeesWorkspace } from "@/components/finance/FinanceFeesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceBillingBatchesPage() {
  return (
    <PageWrapper title="Daily Fee Plans" description="Set class daily fees and create special class billing batches when the school needs one-off charges.">
      <FinanceFeesWorkspace focus="plans" />
    </PageWrapper>
  );
}
