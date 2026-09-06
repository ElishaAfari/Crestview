import { ExtraClassesOverview } from "@/components/finance/ExtraClassesOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function ExtraClassesMonitorPage() {
  return <PageWrapper title="Extra Classes Monitor" description="Review extra-class enrollment and daily collection activity."><ExtraClassesOverview /></PageWrapper>;
}
