import { EmptyState } from "@/components/shared/EmptyState";
import { NotificationItem } from "./NotificationItem";

type NotificationRow = { id: string; title: string; body: string; unread?: boolean };

export function NotificationList({ notifications = [] }: { notifications?: NotificationRow[] }) {
  if (!notifications.length) return <EmptyState title="No messages yet" message="School messages and broadcasts will appear here." />;

  return (
    <div className="space-y-3">
      {notifications.map((notification) => <NotificationItem key={notification.id} {...notification} />)}
    </div>
  );
}
