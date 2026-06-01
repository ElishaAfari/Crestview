import { notFound } from "next/navigation";
import { OperationsRegister } from "@/components/operations/OperationsRegister";
import { loadOperationsModule } from "@/features/operations/queries";

export default async function OperationsModulePage({ params }: { params: Promise<{ workspace: string; module: string }> }) {
  const { workspace, module } = await params;
  const data = await loadOperationsModule(workspace, module);
  if (!data) notFound();
  return <OperationsRegister {...data} />;
}
