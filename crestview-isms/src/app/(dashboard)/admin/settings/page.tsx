import { AcademicPolicyForm } from "@/components/forms/AcademicPolicyForm";
import { EventForm } from "@/components/forms/EventForm";
import { NotificationBroadcast } from "@/components/notifications/NotificationBroadcast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventTable } from "@/components/tables/EventTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listEventsForAdmin } from "@/features/admin/queries";
import { getAcademicPolicySettings } from "@/features/settings/queries";

export default async function AdminSettingsPage() {
  const [events, academicPolicy] = await Promise.all([listEventsForAdmin(), getAcademicPolicySettings()]);
  return (
    <PageWrapper title="Settings" description="Role-aware school configuration, communication, and platform controls.">
      <Card><CardHeader><CardTitle>Academic Policy</CardTitle></CardHeader><CardContent><AcademicPolicyForm settings={academicPolicy} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Broadcast</CardTitle></CardHeader><CardContent><NotificationBroadcast /></CardContent></Card>
      <Card id="schedule-event"><CardHeader><CardTitle>Schedule Event</CardTitle></CardHeader><CardContent><EventForm /></CardContent></Card>
      <Card><CardHeader><CardTitle>Event Register</CardTitle></CardHeader><CardContent><EventTable data={events} /></CardContent></Card>
    </PageWrapper>
  );
}
