import { FinanceFeesWorkspace } from "@/components/finance/FinanceFeesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceInvoicesPage() {
  return (
    <PageWrapper title="Special Invoices" description="Create and manage exceptional invoices that are outside the daily fee collection workflow.">
      <FinanceFeesWorkspace focus="invoices" />
    </PageWrapper>
  );
}
