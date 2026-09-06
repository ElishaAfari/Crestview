import { AccountingOverview } from "@/components/finance/AccountingOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function AccountingPage() {
  return <PageWrapper title="Accounting" description="Double-entry general ledger, reports, and financial dashboards."><AccountingOverview /></PageWrapper>;
}
