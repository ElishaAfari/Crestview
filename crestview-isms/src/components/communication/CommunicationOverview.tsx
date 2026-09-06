import Link from "next/link";
import { ArrowRight, BellRing, Mail, MessageSquare, Megaphone, Send, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsGenericTable } from "@/components/operations/OperationsGenericTable";
import { OperationsRecordForm } from "@/components/operations/OperationsRecordForm";
import { loadOperationsModule } from "@/features/operations/queries";

export async function CommunicationOverview() {
  const [announcements, campaigns, emailQueue, smsQueue, messages] = await Promise.all([
    loadOperationsModule("communication", "announcements"),
    loadOperationsModule("communication", "campaigns"),
    loadOperationsModule("communication", "email-queue"),
    loadOperationsModule("communication", "sms-queue"),
    loadOperationsModule("communication", "messages")
  ]);
  if (!announcements || !campaigns || !emailQueue || !smsQueue || !messages) return null;

  const links = [
    { href: "/messages/sms", label: "SMS queue", description: "Review queued, sent, and failed SMS delivery records.", icon: Send },
    { href: "/messages/email", label: "Email queue", description: "Track invitation, announcement, and report emails.", icon: Mail },
    { href: "/messages/announcements", label: "Announcements", description: "Publish targeted notices to school audiences.", icon: Megaphone },
    { href: "/messages/templates", label: "Templates", description: "Keep repeatable school messages consistent.", icon: BellRing },
    { href: "/messages/groups", label: "Groups and campaigns", description: "Plan targeted multi-channel communication.", icon: Users },
    { href: "/messages/threads", label: "Conversation threads", description: "Follow parent, teacher, and staff conversations.", icon: MessageSquare }
  ];

  return (
    <div className="reference-workspace space-y-6">
      <section className="ref-stats">
        <div className="ref-stat"><span>Total SMS</span><strong>{smsQueue.count}</strong><p>Queued and sent delivery records</p></div>
        <div className="ref-stat"><span>Total email</span><strong>{emailQueue.count}</strong><p>Outbound email delivery records</p></div>
        <div className="ref-stat"><span>Published announcements</span><strong>{announcements.count}</strong><p>Notice board records</p></div>
        <div className="ref-stat"><span>Threads</span><strong>{messages.count}</strong><p>Conversation records</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="ref-panel group block transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4"><span className="ref-avatar"><Icon className="size-5" aria-hidden /></span><ArrowRight className="size-4 text-[var(--portal-muted)] transition group-hover:translate-x-1" aria-hidden /></div>
            <h2 className="mt-4 text-base font-black text-[var(--portal-text)]">{label}</h2><p className="mt-1 text-sm">{description}</p>
          </Link>
        ))}
      </section>

      <Card id="compose-announcement">
        <CardHeader><CardTitle>Compose announcement</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Publish a role-targeted notice that can appear across connected dashboards.</p></CardHeader>
        <CardContent><OperationsRecordForm workspaceKey="communication" moduleKey="announcements" moduleLabel="announcement" fields={announcements.module.createFields ?? []} /></CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent announcements</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Search published and scheduled notices.</p></CardHeader><CardContent>{announcements.records.length ? <OperationsGenericTable records={announcements.records.slice(0, 12)} fields={announcements.module.fields} searchFields={announcements.module.searchFields} /> : <p className="text-sm font-semibold text-[var(--portal-muted)]">No announcements have been published yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Campaign planning</CardTitle><p className="text-sm font-semibold text-[var(--portal-muted)]">Multi-channel communication plans stay visible for follow-up.</p></CardHeader><CardContent><OperationsRecordForm workspaceKey="communication" moduleKey="campaigns" moduleLabel="campaign" fields={campaigns.module.createFields ?? []} /></CardContent></Card>
      </section>
    </div>
  );
}
