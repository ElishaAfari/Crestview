import { TransportOverview } from "@/components/transport/TransportOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function TransportPage() {
  return <PageWrapper title="Transport" description="Coordinate routes, stops, vehicles, trips, and student transport assignments."><TransportOverview /></PageWrapper>;
}
