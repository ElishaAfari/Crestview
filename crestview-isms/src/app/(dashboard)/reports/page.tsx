import { ReportsOverview } from "@/components/reports/ReportsOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function ReportsPage() {
  return <PageWrapper title="Reports" description="Review school KPIs, attendance, finance, academics, HR, inventory, and published report packs."><ReportsOverview /></PageWrapper>;
}
