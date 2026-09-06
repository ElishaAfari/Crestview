import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceDashboardPage() {
  return (
    <PageWrapper title="Finance" description="Fees, invoices, payments, and collections across the school.">
      <FinanceOverview />
    </PageWrapper>
  );
}
