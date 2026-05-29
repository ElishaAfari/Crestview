import { create } from "zustand";
import type { Notification } from "@/types/database.types";

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read_at ? state.unreadCount : state.unreadCount + 1
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read_at: new Date().toISOString() } : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString()
      })),
      unreadCount: 0
    }))
}));
