import { BoardingOverview } from "@/components/boarding/BoardingOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function BoardingPage() {
  return <PageWrapper title="Boarding" description="Manage houses, dormitories, assignments, roll calls, exeats, visitors, and incidents."><BoardingOverview /></PageWrapper>;
}
