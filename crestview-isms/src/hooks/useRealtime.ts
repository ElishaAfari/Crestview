"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification } from "@/types/database.types";
import { useSupabase } from "./useSupabase";

export function useRealtime(userId: string | null) {
  const supabase = useSupabase();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          useNotificationStore.getState().addNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);
}
