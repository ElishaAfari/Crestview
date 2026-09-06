import { FinancePaymentsWorkspace } from "@/components/finance/FinancePaymentsWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinancePaymentsPage() {
  return (
    <PageWrapper title="Payments" description="Track and record payment transactions across the school.">
      <FinancePaymentsWorkspace />
    </PageWrapper>
  );
}
