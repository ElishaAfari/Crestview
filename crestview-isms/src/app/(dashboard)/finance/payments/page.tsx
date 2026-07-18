import { FinanceFeesWorkspace } from "@/components/finance/FinanceFeesWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinancePaymentsPage() {
  return (
    <PageWrapper title="Daily Payments" description="Scan student ID cards, record daily fees, and verify the payment register.">
      <FinanceFeesWorkspace focus="payments" />
    </PageWrapper>
  );
}
