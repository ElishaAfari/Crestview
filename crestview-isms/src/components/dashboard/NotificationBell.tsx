"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";

export function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications" className="relative">
      <Bell className="size-4" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
