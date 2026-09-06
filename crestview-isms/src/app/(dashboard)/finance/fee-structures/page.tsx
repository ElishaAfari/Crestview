import { FinanceFeeStructuresWorkspace } from "@/components/finance/FinanceFeeStructuresWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function FinanceFeeStructuresPage() {
  return (
    <PageWrapper title="Fee Structures" description="Manage daily fee templates for each class and academic period.">
      <FinanceFeeStructuresWorkspace />
    </PageWrapper>
  );
}
