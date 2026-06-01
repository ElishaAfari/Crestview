import { notFound } from "next/navigation";
import { RoleOperationsWorkspace } from "@/components/operations/RoleOperationsWorkspace";
import { loadOperationsWorkspace } from "@/features/operations/queries";

export default async function OperationsWorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: key } = await params;
  const workspace = await loadOperationsWorkspace(key);
  if (!workspace) notFound();
  return <RoleOperationsWorkspace workspace={workspace} />;
}
