import { InventoryOverview } from "@/components/inventory/InventoryOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function InventoryPage() {
  return <PageWrapper title="Inventory & Assets" description="Track school assets, locations, stock movements, maintenance, and disposals."><InventoryOverview /></PageWrapper>;
}
