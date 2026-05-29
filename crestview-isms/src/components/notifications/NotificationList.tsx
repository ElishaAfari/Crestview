import { NotificationItem } from "./NotificationItem";

const notifications = [
  { title: "Grade published", body: "Mathematics midterm results are available.", unread: true },
  { title: "Fee reminder", body: "Term invoice reminders were sent to guardians.", unread: false }
];

export function NotificationList() {
  return (
    <div className="space-y-3">
      {notifications.map((notification) => <NotificationItem key={notification.title} {...notification} />)}
    </div>
  );
}
