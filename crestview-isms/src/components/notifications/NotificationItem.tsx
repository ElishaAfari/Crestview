import { Badge } from "@/components/ui/badge";

export function NotificationItem({ title, body, unread }: { title: string; body: string; unread?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="font-medium text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </div>
      {unread ? <Badge tone="blue">New</Badge> : null}
    </div>
  );
}
