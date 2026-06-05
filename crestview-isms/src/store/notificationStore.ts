import { create } from "zustand";
import type { Notification } from "@/types/database.types";

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read_at).length
    }),
  addNotification: (notification) =>
    set((state) => {
      const exists = state.notifications.some((item) => item.id === notification.id);
      const notifications = exists
        ? state.notifications.map((item) => (item.id === notification.id ? notification : item))
        : [notification, ...state.notifications].slice(0, 30);
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.read_at).length
      };
    }),
  markAsRead: (id) =>
    set((state) => {
      const readAt = new Date().toISOString();
      const notifications = state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read_at: notification.read_at ?? readAt } : notification
      );
      return {
        notifications,
        unreadCount: notifications.filter((notification) => !notification.read_at).length
      };
    }),
  markAllAsRead: () =>
    set((state) => {
      const readAt = new Date().toISOString();
      return {
        notifications: state.notifications.map((notification) => ({
        ...notification,
          read_at: notification.read_at ?? readAt
      })),
        unreadCount: 0
      };
    })
}));
