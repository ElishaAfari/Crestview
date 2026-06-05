import { PageWrapper } from "@/components/layout/PageWrapper";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyNotifications } from "@/features/dashboard/queries";

export default async function ParentMessagesPage() {
  const notifications = await listMyNotifications();

  return (
    <PageWrapper title="Messages" description="Teacher and school communication.">
      <Card><CardHeader><CardTitle>Inbox</CardTitle></CardHeader><CardContent><NotificationList notifications={notifications} /></CardContent></Card>
    </PageWrapper>
  );
}
