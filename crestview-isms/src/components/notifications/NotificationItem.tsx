import { Badge } from "@/components/ui/badge";

export function NotificationItem({ title, body, unread }: { title: string; body: string; unread?: boolean }) {
  return (
    <div className="portal-subtle-card flex items-start justify-between gap-4 rounded-lg p-4">
      <div>
        <h3 className="font-black text-[var(--portal-text)]">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-[var(--portal-muted)]">{body}</p>
      </div>
      {unread ? <Badge tone="blue">New</Badge> : null}
    </div>
  );
}
