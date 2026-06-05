import { Badge } from "@/components/ui/badge";

export function NotificationItem({ title, body, unread }: { title: string; body: string; unread?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4">
      <div>
        <h3 className="font-medium text-[var(--portal-text)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">{body}</p>
      </div>
      {unread ? <Badge tone="blue">New</Badge> : null}
    </div>
  );
}
