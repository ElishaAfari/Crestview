import { CommunicationOverview } from "@/components/communication/CommunicationOverview";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default async function MessagesPage() {
  return <PageWrapper title="Communication Hub" description="Coordinate announcements, SMS, email, templates, groups, meetings, threads, and delivery history."><CommunicationOverview /></PageWrapper>;
}
