import { NotificationBroadcast } from "@/components/notifications/NotificationBroadcast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <PageWrapper title="Settings" description="Role-aware school configuration, communication, and platform controls.">
      <Card><CardHeader><CardTitle>Broadcast</CardTitle></CardHeader><CardContent><NotificationBroadcast /></CardContent></Card>
    </PageWrapper>
  );
}
