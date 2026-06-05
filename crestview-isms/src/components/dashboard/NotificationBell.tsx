"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/features/notifications/actions";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification } from "@/types/database.types";

function formatWhen(value: string | null) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationBell() {
  const supabase = useSupabase();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const recipientId = userId;
    let mounted = true;
    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("id,recipient_id,title,body,type,read_at,metadata,created_at,updated_at,deleted_at")
        .eq("recipient_id", recipientId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30);

      if (mounted) setNotifications((data ?? []) as Notification[]);
    }

    void loadNotifications();
    return () => {
      mounted = false;
    };
  }, [setNotifications, supabase, userId]);

  async function handleMarkRead(notificationId: string) {
    markAsRead(notificationId);
    const formData = new FormData();
    formData.set("notificationId", notificationId);
    await markNotificationReadAction(formData);
  }

  async function handleMarkAllRead() {
    markAllAsRead();
    await markAllNotificationsReadAction();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        title="Notifications"
        className="relative"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--portal-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--portal-text)]">Notifications</p>
              <p className="text-xs text-[var(--portal-muted)]">{unreadCount} unread</p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={handleMarkAllRead} disabled={!unreadCount}>
              <CheckCheck className="size-4" aria-hidden />
              Mark all
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkRead(notification.id)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition hover:bg-white/10",
                    !notification.read_at && "bg-blue-500/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--portal-text)]">{notification.title}</p>
                    {!notification.read_at ? <span className="mt-1 size-2 rounded-full bg-blue-300" aria-label="Unread" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--portal-muted)]">{notification.body}</p>
                  <p className="mt-2 text-[11px] font-medium text-blue-300">{formatWhen(notification.created_at)}</p>
                </button>
              ))
            ) : (
              <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-[var(--portal-border)] text-center">
                <div>
                  <Inbox className="mx-auto size-6 text-[var(--portal-muted)]" aria-hidden />
                  <p className="mt-3 text-sm text-[var(--portal-muted)]">No notifications yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
