import { FinanceInvoicesWorkspace } from "@/components/finance/FinanceInvoicesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceInvoicesPage() {
  return (
    <PageWrapper title="Invoices" description="Manage student fee invoices, issue charges, and record payments.">
      <FinanceInvoicesWorkspace />
    </PageWrapper>
  );
}
