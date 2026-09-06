import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function IdCardsPage() {
  return <PageWrapper title="ID Cards" description="Issue student and staff cards, verify QR identities, and monitor print readiness."><RemainingSuiteOverview workspaceKey="id-cards" /></PageWrapper>;
}
