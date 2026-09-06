import { PageWrapper } from "@/components/layout/PageWrapper";
import { RemainingSuiteOverview } from "@/components/operations/RemainingSuiteOverview";

export default async function PlatformAuditPage() {
  return <PageWrapper title="Platform Audit" description="Monitor approvals, automation queues, integrations, invitations, delivery logs, and protected changes."><RemainingSuiteOverview workspaceKey="platform-audit" /></PageWrapper>;
}
