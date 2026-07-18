import { FinanceFeesWorkspace } from "@/components/finance/FinanceFeesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceDashboardPage() {
  return (
    <PageWrapper title="Finance Suite" description="Daily fee collection, QR verification, receipts, class fee plans, and special invoices.">
      <FinanceFeesWorkspace />
    </PageWrapper>
  );
}
