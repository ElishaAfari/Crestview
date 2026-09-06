import { BursaryReceiptsWorkspace } from "@/components/finance/BursaryReceiptsWorkspace";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function BursaryReceiptsPage() {
  return <PageWrapper title="Receipts" description="Search and manage recorded bursary receipts."><BursaryReceiptsWorkspace /></PageWrapper>;
}
