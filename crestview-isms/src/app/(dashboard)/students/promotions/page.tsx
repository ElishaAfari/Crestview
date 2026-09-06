import { PromotionWorkspace } from "@/components/students/PromotionWorkspace";
import { loadPromotionWorkspace } from "@/features/students/directory-queries";

export default async function StudentPromotionsPage({ searchParams }: { searchParams: Promise<{ runId?: string | string[] }> }) {
  const params = await searchParams;
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const data = await loadPromotionWorkspace(runId);
  return <PromotionWorkspace {...data} />;
}
