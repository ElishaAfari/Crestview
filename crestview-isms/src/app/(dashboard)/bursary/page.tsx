import { BursaryDeskWorkspace } from "@/components/finance/BursaryDeskWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function BursaryPage() {
  return <PageWrapper title="Cashier Desk" description="Record payments, issue receipts, and manage your cash shift."><BursaryDeskWorkspace /></PageWrapper>;
}
