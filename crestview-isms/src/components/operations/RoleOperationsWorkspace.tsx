import type { OperationsModule, OperationsWorkspace } from "@/config/operations";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { OperationsWorkspaceDashboard } from "@/components/operations/OperationsWorkspaceDashboard";

type WorkspaceWithCounts = Omit<OperationsWorkspace, "modules"> & { modules: Array<OperationsModule & { count: number }> };

export function RoleOperationsWorkspace({ workspace }: { workspace: WorkspaceWithCounts }) {
  return (
    <PageWrapper title={workspace.title} description={workspace.description}>
      <OperationsWorkspaceDashboard workspace={workspace} />
    </PageWrapper>
  );
}
